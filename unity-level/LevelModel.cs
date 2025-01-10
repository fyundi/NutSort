using System;
using System.Collections.Generic;
using System.IO;
using GF;
using Guru;
using Protocol;
using UnityEngine;

namespace NSGame
{
    /// <summary>
    /// 关卡相关数据, 每种类型一份，不继承BaseModel
    /// </summary>
    public class LevelModel
    {
        public MapData DefaultMap { get; set; }
        public MapData SaveMap { get; set; }
        public string SavePath { get; set; }
        public StageData CurStage { get; set; }
        public int StageIndex { get; set; }
        public int StageStartLevel { get; set; }
        public int StageEndLevel { get; set; }
        public int LevelCount { get; set; }

        /// <summary>
        /// 根据包内或者不同类型当前等级来计算当前的关卡信息
        /// </summary>
        /// <param name="inPackage"></param>
        /// <param name="level"></param>
        public void ComputeStage(int level, bool inPackage)
        {
            MapData mapData = inPackage ? DefaultMap : SaveMap;
            //获取所有的块的数量
            int count = mapData.stages.Count;
            //设置起始关卡
            StageStartLevel = 1;
            //设置当前总关卡数量
            StageEndLevel = 0;
            //循环计算
            for (int i = 0; i < count; i++)
            {
                //更新总关卡数量
                StageEndLevel += mapData.stages[i].level_count;
                //如果当前关卡小于当前关卡数量
                if (level <= StageEndLevel)
                {
                    //记录当前索引
                    StageIndex = i;
                    return;
                }

                //更新起始关卡块位置
                StageStartLevel = StageEndLevel + 1;
            }

            //关卡超过了当前所有的关卡数量, 重新设置关卡块索引
            StageIndex = count - 1;
            //获取最后一个关卡的数量
            var stageCount = mapData.stages[StageIndex].level_count;
            //更新开始关卡位置
            StageStartLevel = stageCount * (Mathf.FloorToInt(level - StageEndLevel) / stageCount) + StageEndLevel;
            //更新结束关卡位置
            StageEndLevel = StageStartLevel + stageCount;
        }

        public string GetStageId(bool inPackage)
        {
            MapData mapData = inPackage ? DefaultMap : SaveMap;
            return mapData.stages[StageIndex].stage_id;
        }

        public void SetLevelCount()
        {
            LevelCount = CurStage.levels.Count;
        }

        public bool HasSetLevels()
        {
            if (CurStage?.levels == null)
            {
                LogKit.E($"GetLevelData Null, Check CurStage");
                return false;
            }

            return true;
        }

        /// <summary>
        /// 获取本地对应的关卡文件， lv_1_366
        /// </summary>
        /// <returns></returns>
        public string GetSaveStageFilePath()
        {
            if (SaveMap == null) return "";
            return Path.Combine(SavePath, SaveMap.update_at.ToString(), SaveMap.stages[StageIndex].stage_id);
        }

        public StageDesc GetStageDesc(bool inPackage)
        {
            MapData mapData = inPackage ? DefaultMap : SaveMap;
            if (mapData.stages == null || StageIndex >= mapData.stages.Count)
            {
                LogKit.E($"GetStageDesc Null, Check MapData");
                return null;
            }

            return mapData.stages[StageIndex];
        }

        /// <summary>
        /// 根据云控配置检查，是否需要更新
        /// </summary>
        /// <returns></returns>
        public bool IsNeedUpdate(MapDesc desc)
        {
            return (SaveMap == null || SaveMap.update_at < desc.update_at) && DefaultMap.update_at < desc.update_at;
        }
    }
}