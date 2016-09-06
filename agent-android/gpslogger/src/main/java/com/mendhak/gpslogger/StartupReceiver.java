/*
*    This file is part of GPSLogger for Android.
*
*    GPSLogger for Android is free software: you can redistribute it and/or modify
*    it under the terms of the GNU General Public License as published by
*    the Free Software Foundation, either version 2 of the License, or
*    (at your option) any later version.
*
*    GPSLogger for Android is distributed in the hope that it will be useful,
*    but WITHOUT ANY WARRANTY; without even the implied warranty of
*    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*    GNU General Public License for more details.
*
*    You should have received a copy of the GNU General Public License
*    along with GPSLogger for Android.  If not, see <http://www.gnu.org/licenses/>.
*/

package com.mendhak.gpslogger;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import com.mendhak.gpslogger.Manager.CheckConnectionManager;
import com.mendhak.gpslogger.common.events.CommandEvents;
import com.mendhak.gpslogger.utils.LogUtil;
import de.greenrobot.event.EventBus;


public class StartupReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            Intent serviceIntent = new Intent(context, GpsLoggingService.class);
            context.startService(serviceIntent);

            CheckConnectionManager.stance.init();
            if (CheckConnectionManager.stance.hasConfig()) {
                EventBus.getDefault().postSticky(new CommandEvents.RequestStartStop(true));
            }

            LogUtil.d("StartupReceiver", "Starting GpsLoggingService --> " + "intent.getAction():" + intent.getAction());
        } catch (Exception ex) {
            LogUtil.e("StartupReceiver", ex);
        }

    }

}
