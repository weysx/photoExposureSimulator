package com.photo.backend;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("article")
public class Article {
    @TableId
    private Integer id;
    private String keyName;
    private String title;
    private String content;
    private Integer viewCount;
}