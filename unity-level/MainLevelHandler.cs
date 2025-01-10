using System.Collections.Generic;
using Cysharp.Threading.Tasks;
using GF;
using UnityEngine;

namespace NSGame
{
    /// <summary>
    /// 处理主线关卡特殊逻辑
    /// </summary>
    public class MainLevelHandler : ILevelHandler
    {
        #region interface

        public bool IsInited { get; set; }
        public string Tag => "MainLevel";
        public string Prefix => "";

        public int FirstLevel => Level - LevelDistance < 1 ? 1 : Level - LevelDistance;

        public LevelModel LevelModel { get; }

        public LevelData GetLevelData(int level)
        {
            if (!_cacheLevels.ContainsKey(level))
            {
                LogKit.E("UnityTest: 没命中,重置关卡缓存" + level);
                BaseLevelMgr.Instance.InitStage(this, level);
            }

            UpdateLevels(level);
            return _cacheLevels[level];
        }

        public int Level
        {
            get => App.LocalStorage.GetData(Tag, 1);
            set => App.LocalStorage.SetData(Tag, value);
        }

        /// <summary>
        /// 主线关卡根据model中数据单独缓存一份
        /// </summary>
        public void InitLevels()
        {
            if (!LevelModel.HasSetLevels()) return;
            for (var i = 0; i < LevelModel.CurStage.levels.Count; i++)
            {
                if (LevelModel.StageStartLevel + i < FirstLevel) continue;
                _cacheLevels[LevelModel.StageStartLevel + i] = LevelModel.CurStage.levels[i];
            }

            IsInited = true;
        }

        /// <summary>
        /// 云控地图配置
        /// </summary>
        public MapDesc RemoteMapConfig
        {
            get => ConfigMgr.Instance.MainLevelMapDesc;
        }

        /// <summary>
        /// 收到等级更新
        /// </summary>
        /// <param name="level"></param>
        public void UpdateLevels(int level)
        {
            var delKey = level - LevelDistance;
            if (_cacheLevels.ContainsKey(delKey))
            {
                _cacheLevels.Remove(delKey);
            }

            if (level + LevelDistance > LevelModel.StageEndLevel)
            {
                BaseLevelMgr.Instance.InitStage(this, LevelModel.StageEndLevel + 1);
            }
        }

        #endregion


        //缓存关卡数据，可跨越stage
        private readonly Dictionary<int, LevelData> _cacheLevels;

        private const int LevelDistance = 5;

        public MainLevelHandler()
        {
            LevelModel = new LevelModel();
            _cacheLevels = new Dictionary<int, LevelData>();
        }
    }
}