package com.example.geoneighbr.controller;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.client.RestTemplate;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Controller
@RequestMapping("/game")
public class GameController {

    // TODO - inject auth token instead of keeping it in the code.

    @PostMapping("/new")
    public ResponseEntity<Object> startGame(@RequestBody String cityName) {
        String encodedQuery;
        try {
            encodedQuery = URLEncoder.encode(cityName, StandardCharsets.UTF_8.toString());
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
        RestTemplate restTemplate = new RestTemplate();
        String url = String.format("https://api.foursquare.com/v3/places/search?near=%s&exclude_all_chains=true&sort=popularity", encodedQuery);
        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", ""); // TODO - Add your token here
        HttpEntity<String> fsqRequest = new HttpEntity<String>(headers);
        ResponseEntity<String> fsqResponse = restTemplate.exchange(url, HttpMethod.GET, fsqRequest, String.class);
        System.out.println(fsqResponse.getBody());
        return ResponseEntity.ok(fsqResponse.getBody());
    }
}
