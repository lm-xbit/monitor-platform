package com.mendhak.gpslogger.utils;

import android.content.Context;
import com.mendhak.gpslogger.BuildConfig;

/**
 * 将崩溃异常记录在文件中，方便我们查看异常
 *
 * @author Tsimle
 */
public class CrashHandler implements Thread.UncaughtExceptionHandler {

    private Thread.UncaughtExceptionHandler mDefaultHandler;
    private Context mContext;

    public CrashHandler(Context context) {
        mDefaultHandler = Thread.getDefaultUncaughtExceptionHandler();
        mContext = context.getApplicationContext();
    }

    @Override
    public void uncaughtException(Thread thread, Throwable ex) {
        if (null != ex) {
            if (BuildConfig.DEBUG) {
                LogUtil.f(ex);
            }

            // 弹出程序crash的对话框
            mDefaultHandler.uncaughtException(thread, ex);
        }
    }
}
