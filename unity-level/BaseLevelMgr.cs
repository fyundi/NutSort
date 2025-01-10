using System.Collections.Generic;
using System.IO;
using Cysharp.Threading.Tasks;
using GF;
using UnityEngine;

namespace NSGame
{
    public interface ILevelHandler
    {
        MapDesc RemoteMapConfig { get; }
        bool IsInited { get; set; }
        string Tag { get; }
        string Prefix { get; }
        int FirstLevel { get; }
        LevelModel LevelModel { get; }
        LevelData GetLevelData(int level);

        int Level { get; set; }
        void InitLevels();
    }

    /// <summary>
    /// 单例类，处理关卡公共逻辑
    /// </summary>
    public class BaseLevelMgr : GF.Singleton<BaseLevelMgr>
    {
        private const string ConfigPath = "Assets/NSGame/Bundles/Configs/Level/";
        private const string SaveDicName = "cache";
        private const string MapDataName = "mapdata";


        #region 关卡注册

        private readonly Dictionary<ELevelGroup, ILevelHandler> _registeredHandler = new Dictionary<ELevelGroup, ILevelHandler>();

        public void Register(ELevelGroup group, ILevelHandler handler)
        {
            _registeredHandler.TryAdd(group, handler);
        }

        public void Unregister(ELevelGroup group)
        {
            if (_registeredHandler.ContainsKey(group))
            {
                _registeredHandler.Remove(group);
            }
        }

        public ILevelHandler GetLevelHandler(ELevelGroup group)
        {
            _registeredHandler.TryGetValue(group, out ILevelHandler handler);
            if (handler == null)
            {
                LogKit.E("GetLevelHandler Is Null, Check Group");
            }
            return handler;
        }

        #endregion


        public override void Initialize()
        {
            //TODO 初始化时机
            foreach (var handler in _registeredHandler.Values)
            {
                InitializeMgr(handler);
            }
        }

        /// <summary>
        /// 通用的初始化方法
        /// </summary>
        /// <param name="handler">具体的 LevelMgr 实现类</param>
        private async UniTask InitializeMgr(ILevelHandler handler)
        {
            //1. 加载bundle内配置，并设置DefaultMap数据
            await LoadMapConfigAsync(handler);
            //2. 本地获取一次_saveMap
            ReadSavaMapData(handler);
            //3. 初始化当前关卡相关数据
            InitStage(handler, handler.FirstLevel);
        }

        /// <summary>
        /// 加载bundle内配置文件并解析为 MapData
        /// </summary>
        /// <param name="handler">具体的关卡实现类</param>
        /// <returns>解析后的 MapData 对象</returns>
        private async UniTask LoadMapConfigAsync(ILevelHandler handler)
        {
            string path = Path.Combine(ConfigPath, $"{handler.Prefix}{MapDataName}");
            TextAsset ta = await App.Res.LoadAssetAsync<TextAsset>($"{path}.json", ConfigKit.PackageName);
            handler.LevelModel.DefaultMap = Utility.Json.Deserialize<MapData>(ta.text);
            LogKit.I($"{handler.Tag}:bundle配置加载成功: {ta}");
        }

        /// <summary>
        /// 读取本地persistentDataPath目录下的mapdata数据
        /// </summary>
        /// <param name="handler"></param>
        /// <returns></returns>
        private void ReadSavaMapData(ILevelHandler handler)
        {
            handler.LevelModel.SavePath = Path.Combine(Application.persistentDataPath, SaveDicName);
            string path = Path.Combine(handler.LevelModel.SavePath, $"{handler.Prefix}{MapDataName}");
            if (File.Exists(path))
            {
                string mapDataStr = Utility.Files.ReadStringByFile(path);
                handler.LevelModel.SaveMap = Utility.Json.Deserialize<MapData>(mapDataStr);
                LogKit.I($"{handler.Tag}:SaveMap加载成功: {mapDataStr}");
            }
        }

        public async void InitStage(ILevelHandler handler, int level)
        {
            MapData saveMap = handler.LevelModel.SaveMap;
            MapData defaultMap = handler.LevelModel.DefaultMap;

            if (saveMap == null || saveMap.update_at < defaultMap.update_at)
            {
                handler.LevelModel.ComputeStage(level, true);
                SetCurStageInPackage(handler);
            }
            else
            {
                handler.LevelModel.ComputeStage(level, false);
                // 如果本地文件已存在，从本地中读取
                string saveStageFilePath = handler.LevelModel.GetSaveStageFilePath();
                if (!File.Exists(saveStageFilePath))
                {
                    // 启动下载, 等下载完成后再次更新
                    DownloadStage(handler);
                    // 先用包内设置一次数据
                    handler.LevelModel.ComputeStage(level, true);
                    SetCurStageInPackage(handler);
                }
                else
                {
                    SetCurStageInPersistentData(handler);
                }
            }

            handler.InitLevels();
        }

        /// <summary>
        /// 从包内设置当前的关卡， 用于刚进游戏，如果没有本地下载的情况
        /// </summary>
        private async void SetCurStageInPackage(ILevelHandler handler)
        {
            string stageConfigName = handler.LevelModel.GetStageId(true);
            string path = Path.Combine(ConfigPath, $"{handler.Prefix}{stageConfigName}");
            // TextAsset ta = await App.Res.LoadAssetAsync<TextAsset>($"{path}.json", ConfigKit.PackageName);
            TextAsset ta = App.Res.LoadAsset<TextAsset>($"{path}.json", ConfigKit.PackageName);
            handler.LevelModel.CurStage = Utility.Json.Deserialize<StageData>(ta.text);
            LogKit.I($"{handler.Tag}:DefaultStage读取成功");
        }

        /// <summary>
        /// 获取当本地下载的文件后，设置的当前关卡数据
        /// </summary>
        private void SetCurStageInPersistentData(ILevelHandler handler)
        {
            string stageDataStr = Utility.Files.ReadStringByFile(handler.LevelModel.GetSaveStageFilePath());
            handler.LevelModel.CurStage = Utility.Json.Deserialize<StageData>(stageDataStr);
            LogKit.I($"{handler.Tag}:SaveStage读取成功");
        }

        /// <summary>
        /// 下载地图数据
        /// </summary>
        private void DownloadMap(ILevelHandler handler)
        {
            MapDesc mapDesc = handler.RemoteMapConfig;
            if (mapDesc == null) return;
            string mapFilePath = Path.Combine(handler.LevelModel.SavePath, $"{handler.Prefix}{MapDataName}");
            string fixedPath = CdnLoaderMgr.Instance.GetFixedUrl(mapDesc.url);
            LogKit.I($"{handler.Tag}:开始下载文件， 保存地址：{mapFilePath}");
            DownloadFileMgr.Instance.DownloadFile(fixedPath, mapFilePath,
                () => { OnMapFileDownSuccess(handler); });
        }

        /// <summary>
        /// 下载关卡数据， url是远程配置
        /// </summary>
        /// <param name="handler"></param>
        private void DownloadStage(ILevelHandler handler)
        {
            StageDesc stageDesc = handler.LevelModel.GetStageDesc(false);
            if (stageDesc == null) return;
            string stageFilePath = handler.LevelModel.GetSaveStageFilePath();
            string fixedPath = CdnLoaderMgr.Instance.GetFixedUrl(stageDesc.url);
            DownloadFileMgr.Instance.DownloadFile(fixedPath, stageFilePath,
                () => { OnStageLevelFileDownSuccess(handler); });
        }

        private void OnStageLevelFileDownSuccess(ILevelHandler handler)
        {
            LogKit.I($"{handler.Tag}:OnStageLevelFileDownSuccess下载成功");
            handler.LevelModel.ComputeStage(handler.FirstLevel, false);
            SetCurStageInPersistentData(handler);
            handler.InitLevels();
        }

        private void OnMapFileDownSuccess(ILevelHandler handler)
        {
            LogKit.I($"{handler.Tag}:OnMapFileDownSuccess下载成功");
            ReadSavaMapData(handler);
            handler.LevelModel.ComputeStage(handler.FirstLevel, false);
            DownloadStage(handler);
        }

        /// <summary>
        /// 检查下是否存在更新
        /// </summary>
        public void CheckUpdate()
        {
            if (!CdnLoaderMgr.Instance.CdnLoaderInited) return;
            foreach (var handler in _registeredHandler.Values)
            {
                if (handler.LevelModel.IsNeedUpdate(handler.RemoteMapConfig))
                {
                    DownloadMap(handler);
                }
            }
        }

        public int GetLevel(ELevelGroup group = ELevelGroup.Main)
        {
            ILevelHandler handler = GetLevelHandler(group);
            return handler.Level;
        }

        public void SetLevel(int level, ELevelGroup group = ELevelGroup.Main)
        {
            ILevelHandler handler = GetLevelHandler(group);
            handler.Level = level;
        }

        /// <summary>
        /// 获取某一关的关卡的数据
        /// </summary>
        /// <param name="group"></param>
        /// <param name="level"></param>
        /// <returns></returns>
        public LevelData GetLevelData(int level, ELevelGroup group = ELevelGroup.Main)
        {
            ILevelHandler handler = GetLevelHandler(group);
            return handler?.GetLevelData(level);
        }

        /// <summary>
        /// 是否可以进入特殊关卡
        /// </summary>
        public bool IsEnterSpecifiedLevel()
        {
            ILevelHandler handler = GetLevelHandler(ELevelGroup.Special);
            return (handler as SpecialLevelHandler)?.IsEnterSpecifiedLevel() ?? false;
        }

        /// <summary>
        /// 主线关卡更新
        /// </summary>
        /// <param name="level"></param>
        public void OnMainLevelUpdate(int level)
        {
            ILevelHandler handler = GetLevelHandler(ELevelGroup.Main);
            (handler as MainLevelHandler)?.UpdateLevels(level);
        }
    }
}