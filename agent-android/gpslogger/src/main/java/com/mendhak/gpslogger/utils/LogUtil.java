package com.mendhak.gpslogger.utils;

import android.support.v4.BuildConfig;
import android.util.Log;
import com.mendhak.gpslogger.common.AppSettings;

import java.text.SimpleDateFormat;
import java.util.Locale;

/**
 * Created by steven.li on 9/6/16.
 */
public class LogUtil {
    public static boolean sLogEnable = BuildConfig.DEBUG;

    private static final String DEFAULT_TAG = AppSettings.gContext.getPackageName();

    public static final int TYPE_V = 0x01;

    public static final int TYPE_D = TYPE_V << 1;
    public static final int TYPE_I = TYPE_D << 1;
    public static final int TYPE_W = TYPE_I << 1;
    public static final int TYPE_E = TYPE_W << 1;
    private static final String LOG_PATH = "background.log";

    private static final int LOG_SIZE = 1024 * 500;
    private static SimpleDateFormat sFormat = new SimpleDateFormat("[yy-MM-dd hh:mm:ss]", Locale.CHINA);

    private LogUtil() {
        /* Protect from instantiations */
    }

    //*******************Log ERROR*******************/
    public static void e(String msg) {
        log(DEFAULT_TAG, msg, TYPE_E, false);
    }

    public static void e(Exception e) {
        log(DEFAULT_TAG, Log.getStackTraceString(e), TYPE_E, false);
    }

    public static void e(Throwable tr) {
        log(DEFAULT_TAG, Log.getStackTraceString(tr), TYPE_E, false);
    }

    public static void e(String tag, String msg) {
        log(tag, msg, TYPE_E, false);
    }

    public static void e(String tag, Exception e) {
        log(tag, Log.getStackTraceString(e), TYPE_E, false);
    }

    public static void e(String tag, Throwable tr) {
        log(tag, Log.getStackTraceString(tr), TYPE_E, false);
    }

    public static void e(Object tag, String msg) {
        log(tag.getClass().getSimpleName(), msg, TYPE_E, false);
    }

    public static void e(Object tag, Exception e) {
        log(tag.getClass().getSimpleName(), Log.getStackTraceString(e), TYPE_E, false);
    }

    public static void e(Object tag, Throwable tr) {
        log(tag.getClass().getSimpleName(), Log.getStackTraceString(tr), TYPE_E, false);
    }

    public static void e(String tag, String msg, Throwable tr) {
        log(tag, msg + '\n' + Log.getStackTraceString(tr), TYPE_E, false);
    }

    //*******************Log  WARNING*******************/
    public static void w(String msg) {
        log(DEFAULT_TAG, msg, TYPE_W, false);
    }

    public static void w(Exception e) {
        log(DEFAULT_TAG, Log.getStackTraceString(e), TYPE_W, false);
    }

    public static void w(Throwable tr) {
        log(DEFAULT_TAG, Log.getStackTraceString(tr), TYPE_W, false);
    }

    public static void w(String tag, String msg) {
        log(tag, msg, TYPE_W, false);
    }

    public static void w(String tag, Exception e) {
        log(tag, Log.getStackTraceString(e), TYPE_W, false);
    }

    public static void w(String tag, Throwable tr) {
        log(tag, Log.getStackTraceString(tr), TYPE_W, false);
    }

    public static void w(Object tag, String msg) {
        log(tag.getClass().getSimpleName(), msg, TYPE_W, false);
    }

    public static void w(Object tag, Exception e) {
        log(tag.getClass().getSimpleName(), Log.getStackTraceString(e), TYPE_W, false);
    }

    public static void w(Object tag, Throwable tr) {
        log(tag.getClass().getSimpleName(), Log.getStackTraceString(tr), TYPE_W, false);
    }

    public static void w(String tag, String msg, Throwable tr) {
        log(tag, msg + '\n' + Log.getStackTraceString(tr), TYPE_W, false);
    }

    //*******************Log INFO*******************/
    public static void i(String msg) {
        log(DEFAULT_TAG, msg, TYPE_I, false);
    }

    public static void i(String tag, String msg) {
        log(tag, msg, TYPE_I, false);
    }

    public static void i(Object tag, String msg) {
        log(tag.getClass().getSimpleName(), msg, TYPE_I, false);
    }

    //*******************Log DEBUG*******************/
    public static void d(String msg) {
        log(DEFAULT_TAG, msg, TYPE_D, false);
    }

    public static void d(String tag, String msg) {
        log(tag, msg, TYPE_D, false);
    }

    public static void d(Object tag, String msg) {
        log(tag.getClass().getSimpleName(), msg, TYPE_D, false);
    }

    //*******************Log VERBOSE*******************/
    public static void v(String msg) {
        log(DEFAULT_TAG, msg, TYPE_V, false);
    }

    public static void v(String tag, String msg) {
        log(tag, msg, TYPE_V, false);
    }

    public static void v(Object tag, String msg) {
        log(tag.getClass().getSimpleName(), msg, TYPE_V, false);
    }

    //*******************Log with FILE*******************/

    public static void f(String msg) {
        log(DEFAULT_TAG, msg, TYPE_I, true);
    }

    public static void f(Exception e) {
        log(DEFAULT_TAG, Log.getStackTraceString(e), TYPE_E, true);
    }

    public static void f(Throwable tr) {
        log(DEFAULT_TAG, Log.getStackTraceString(tr), TYPE_E, true);
    }

    public static void f(String tag, String msg) {
        log(tag, msg, TYPE_I, true);
    }

    public static void f(String tag, Exception e) {
        log(tag, Log.getStackTraceString(e), TYPE_E, true);
    }

    public static void f(String tag, Throwable tr) {
        log(tag, Log.getStackTraceString(tr), TYPE_E, true);
    }

    public static void f(Object tag, String msg) {
        log(tag.getClass().getSimpleName(), msg, TYPE_I, true);
    }

    public static void f(Object tag, Exception e) {
        log(tag.getClass().getSimpleName(), Log.getStackTraceString(e), TYPE_E, true);
    }

    public static void f(Object tag, Throwable tr) {
        log(tag.getClass().getSimpleName(), Log.getStackTraceString(tr), TYPE_E, true);
    }

    public static void f(String tag, String msg, Throwable tr) {
        log(tag, msg + '\n' + Log.getStackTraceString(tr), TYPE_E, true);
    }

    private static void log(String tag, String msg, int logType, boolean toFile) {
        if (sLogEnable) {
            StackTraceElement stackTrace = Thread.currentThread().getStackTrace()[4];
            String fileInfo = "[" + stackTrace.getFileName() + "(" +
                    stackTrace.getLineNumber() + ") " +
                    stackTrace.getMethodName() + "] ";

            msg = fileInfo + msg;

            switch (logType) {
                case TYPE_V:
                    Log.v(tag, msg);
                    break;

                case TYPE_D:
                    Log.d(tag, msg);
                    break;

                case TYPE_I:
                    Log.i(tag, msg);
                    break;

                case TYPE_W:
                    Log.w(tag, msg);
                    break;

                case TYPE_E:
                    Log.e(tag, msg);
                    break;

                default:
                    break;
            }
        }
    }
}
