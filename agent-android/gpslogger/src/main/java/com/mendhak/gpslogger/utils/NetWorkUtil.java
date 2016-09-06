package com.mendhak.gpslogger.utils;

import android.content.Context;
import android.database.Cursor;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Proxy;
import android.net.Uri;
import android.text.TextUtils;

/**
 * Created by steven.li on 9/6/16.
 */
public class NetWorkUtil {
    /**
     * 获取网络状态
     *
     * @return 网络状态：State.
     */
    public static NetworkInfo.State getConnectionState(Context context) {
        ConnectivityManager sManager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo info = sManager.getActiveNetworkInfo();
        if (info != null) {
            return info.getState();
        }
        return NetworkInfo.State.UNKNOWN;
    }

    /**
     * 网络连接是否已连接好
     *
     * @return
     */
    public static boolean isConnected(Context context) {
        return NetworkInfo.State.CONNECTED.equals(getConnectionState(context));
    }

    /**
     * 获取网络状态
     *
     * @param context
     * @return
     */
    public static NetworkState getNetworkState(Context context) {
        ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo info = cm.getActiveNetworkInfo();
        if (info == null || !info.isAvailable()) {
            return NetworkState.NOTHING;
        } else {
            if (info.getType() == ConnectivityManager.TYPE_MOBILE) {
                return NetworkState.MOBILE;
            } else {
                return NetworkState.WIFI;
            }
        }
    }

    /**
     * 获取代理主机和端口
     *
     * @param context
     * @return
     */
    public static String[] getProxyHostAndPort(Context context) {
        if (getNetworkState(context) == NetworkState.WIFI) {
            return new String[]{"", "-1"};
        } else {
            return new String[]{Proxy.getDefaultHost(), "" + Proxy.getDefaultPort()};
        }
    }

    /**
     * 手否是WAP连接方式
     *
     * @param context
     * @return
     */
    public static boolean isWapNet(Context context) {
        String currentAPN;
        ConnectivityManager conManager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo info = conManager.getActiveNetworkInfo();
        if (info == null || !info.isAvailable()) {
            return false;
        }
        if (info.getType() == ConnectivityManager.TYPE_WIFI) {
            return false;
        }
        currentAPN = info.getExtraInfo();
        return !TextUtils.isEmpty(currentAPN) && (currentAPN.equals("cmwap") || currentAPN.equals("uniwap") ||
                currentAPN.equals("3gwap"));
    }

    /**
     * 获取APN
     *
     * @param context
     * @return
     */
    public static APNWrapper getAPN(Context context) {
        APNWrapper wrapper = new APNWrapper();
        Cursor cursor = null;
        try {
            cursor = context.getContentResolver().query(Uri.parse("content://telephony/carriers/preferapn"), new String[]{"name", "apn", "proxy",
                    "port"}, null, null, null);
        } catch (Exception e) {
            // 为了解决在4.2系统上禁止非系统进程获取apn相关信息，会抛出安全异常
            // java.lang.SecurityException: No permission to write APN settings
        }
        if (cursor != null) {
            cursor.moveToFirst();
            if (cursor.isAfterLast()) {
                wrapper.name = "N/A";
                wrapper.apn = "N/A";
            } else {
                String name = cursor.getString(0);
                String apn = cursor.getString(1);
                wrapper.name = name == null ? "" : name.trim();
                wrapper.apn = apn == null ? "" : apn.trim();
            }
            cursor.close();
        } else {
            wrapper.name = "N/A";
            wrapper.apn = "N/A";
        }
        wrapper.proxy = Proxy.getDefaultHost();
        wrapper.proxy = TextUtils.isEmpty(wrapper.proxy) ? "" : wrapper.proxy;
        wrapper.port = Proxy.getDefaultPort();
        wrapper.port = wrapper.port > 0 ? wrapper.port : 80;
        return wrapper;
    }

    /**
     * 网络状态枚举
     */
    public enum NetworkState {
        NOTHING, MOBILE, WIFI
    }

    /**
     * APN结构
     *
     * @author magic-lee
     * @date 2013-03-14
     */
    public static class APNWrapper {
        public String name;
        public String apn;
        public String proxy;
        public int port;

        public String getApn() {
            return apn;
        }

        public String getName() {
            return name;
        }

        public int getPort() {
            return port;
        }

        public String getProxy() {
            return proxy;
        }

        APNWrapper() {
        }

        @Override
        public String toString() {
            return "{name=" + name + ";apn=" + apn + ";proxy=" + proxy + ";port=" + port + "}";
        }
    }
}
