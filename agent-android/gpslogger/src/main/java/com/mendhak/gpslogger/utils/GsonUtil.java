package com.mendhak.gpslogger.utils;

import com.google.gson.*;

import java.lang.reflect.Type;
import java.util.Date;

/**
 * Created by magic-lee on 15/4/9.
 */
public class GsonUtil {
    private static Gson gson;

    static {
        GsonBuilder builder = new GsonBuilder();
        builder.setFieldNamingPolicy(FieldNamingPolicy.LOWER_CASE_WITH_UNDERSCORES);
        builder.registerTypeAdapter(Date.class, new JsonDeserializer() {
            public Date deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) {
                return json == null ? null : new Date(json.getAsLong() * 1000L);
            }
        });
        gson = builder.create();
    }

    public static <T> T fromJson(String json, Type type) {
        return gson.fromJson(json, type);
    }

    public static <T> T fromJson(String json, Class<T> clazz) {
        return gson.fromJson(json, clazz);
    }

    public static <T> T fromJson(byte[] bytes, Class<T> clazz) {
        return gson.fromJson(new String(bytes), clazz);
    }

    public static String toJson(Object src) {
        return gson.toJson(src);
    }
}
