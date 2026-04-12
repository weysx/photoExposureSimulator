package com.photo.backend;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/article")
@CrossOrigin(origins = "*") // 🌟 允许前端跨域访问
public class ArticleController {

    @Autowired
    private ArticleMapper articleMapper;

    @GetMapping("/{keyName}")
    public Article getArticle(@PathVariable String keyName) {
        QueryWrapper<Article> wrapper = new QueryWrapper<>();
        wrapper.eq("key_name", keyName);
        return articleMapper.selectOne(wrapper);
    }
}