using System;
using System.Collections.Generic;
using Guru;

namespace NSGame
{
    #region Map

    /// <summary>
    /// 关卡块存放的图的配置
    /// </summary>
    [Serializable]
    public class MapData
    {
        /// <summary>
        /// 图的更新时间
        /// </summary>
        public long update_at { get; set; }

        /// <summary>
        /// 所有的块的存储
        /// </summary>
        public List<StageDesc> stages { get; set; }
    }

    /// <summary>
    /// Firebase.RemoteConfig
    /// </summary>
    public class MapDesc
    {
        public long update_at { get; set; }
        public string url { get; set; }
        public int start_level { get; set; }
    }

    #endregion

    #region Stage

    /// <summary>
    /// 关卡块结构
    /// </summary>
    [Serializable]
    public class StageData
    {
        /// <summary>
        /// 关卡块ID
        /// </summary>
        public string stage_id { get; set; }

        /// <summary>
        /// 关卡数据
        /// </summary>
        public List<LevelData> levels { get; set; }

        /// <summary>
        /// 根据索引获取关卡数据
        /// </summary>
        /// <param name="index"></param>
        /// <returns></returns>
        public LevelData GetData(int index)
        {
            LevelData data = default;
            if (levels.Count <= index || index < 0)
            {
                index = 0;
            }

            data = levels[index];
            return data;
        }
    }

    /// <summary>
    /// 关卡块描述
    /// </summary>
    [Serializable]
    public class StageDesc
    {
        /// <summary>
        /// 关卡块ID
        /// </summary>
        public string stage_id { get; set; }

        /// <summary>
        /// 关卡数据的数量
        /// </summary>
        public int level_count { get; set; }

        /// <summary>
        /// 数据存放地址
        /// </summary>
        public string url { get; set; }
    }

    #endregion

    #region Level

    /// <summary>
    /// 关卡结构
    /// </summary>
    [Serializable]
    public class LevelData
    {
        /// <summary>
        /// 关卡ID
        /// </summary>
        public string puzzle_id { get; set; }

        /// <summary>
        /// 水管配置
        /// </summary>
        public List<int[]> tubes { get; set; }

        /// <summary>
        /// 解题步骤
        /// </summary>
        public List<int[]> steps { get; set; }

        /// <summary>
        /// 关卡类型 0为普通 1为问号 2为困难  3为特殊 
        /// </summary>
        public int level_type;

        public int GetTubeCount()
        {
            if (tubes == null) return 0;
            var total = 0;
            foreach (var tubeArr in tubes)
            {
                if (tubeArr[0] == 0)
                    continue;
                total += tubeArr.Length;
            }

            return total;
        }
    }

    #endregion


    #region 云控其他配置

    public class SpecialLevelRuleConfig
    {
        /// <summary>
        /// 是否开启功能
        /// </summary>
        public bool enable;

        /// <summary>
        /// 多少关起用
        /// </summary>
        public int start;

        /// <summary>
        /// 每隔多少关出现
        /// </summary>
        public int offset;
    }

    #endregion
}