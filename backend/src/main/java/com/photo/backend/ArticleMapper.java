package com.photo.backend;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ArticleMapper extends BaseMapper<Article> {
    // 继承 BaseMapper 后，自动拥有了增删改查能力
}