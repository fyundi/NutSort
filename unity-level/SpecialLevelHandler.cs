using System.Collections.Generic;
using Cysharp.Threading.Tasks;
using GF;
using UnityEngine;

namespace NSGame
{
    /// <summary>
    /// 处理特殊关卡特殊逻辑
    /// </summary>
    public class SpecialLevelHandler : ILevelHandler
    {
        private GlobalModel GModel => ModelMgr.Instance.GetModel<GlobalModel>();

        #region interface

        public bool IsInited { get; set; }
        public string Tag => "SpecialLevel";

        public string Prefix => "s_";
        public LevelModel LevelModel { get; }

        public int FirstLevel => 1;

        public LevelData GetLevelData(int level)
        {
            if (!LevelModel.HasSetLevels()) return null;
            int index = level - LevelModel.StageStartLevel;
            if (index < 0 || index >= LevelModel.CurStage.levels.Count) return null;
            return LevelModel.CurStage.levels[index];
        }

        public int Level
        {
            get
            {
                var config = ConfigMgr.Instance.SpecialLevelRuleConfig;
                var mainLevel = GModel.MainLevel;
                LogKit.I($"GetMainLevel:{mainLevel}");
                return (mainLevel - 1 - config.start) / config.offset + 1;
            }
            set { }
        }

        public void InitLevels()
        {
            LevelModel.SetLevelCount();
            IsInited = true;
        }

        /// <summary>
        /// 云控地图配置
        /// </summary>
        public MapDesc RemoteMapConfig
        {
            get => ConfigMgr.Instance.SpecialLevelMapDesc;
        }

        #endregion

        public SpecialLevelHandler()
        {
            LevelModel = new LevelModel();
        }

        public bool IsEnterSpecifiedLevel()
        {
            var config = ConfigMgr.Instance.SpecialLevelRuleConfig;
            var specifiedLevel = Level;
            var mainLevel = GModel.MainLevel;
            var isHit = config.enable && mainLevel > config.start &&
                        PassedSpecialLevel < specifiedLevel &&
                        (mainLevel - 1 - config.start) % config.offset == 0 &&
                        specifiedLevel <= LevelModel.LevelCount;
            if (isHit) PassedSpecialLevel = specifiedLevel;
            return isHit;
        }

        /// <summary>
        /// 记录已通关的特殊关卡等级
        /// </summary>
        public int PassedSpecialLevel
        {
            get => App.LocalStorage.GetData(nameof(PassedSpecialLevel), 0);
            set => App.LocalStorage.SetData(nameof(PassedSpecialLevel), value);
        }
    }
}