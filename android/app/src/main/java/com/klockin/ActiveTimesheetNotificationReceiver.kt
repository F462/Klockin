package com.github.f462.klockin

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class ActiveTimesheetNotificationReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      ACTION_PAUSE -> WidgetActionWorker.enqueueAction(context, WidgetActionWorker.ACTION_PAUSE)
      ACTION_RESUME -> WidgetActionWorker.enqueueAction(context, WidgetActionWorker.ACTION_RESUME)
      ACTION_STOP -> WidgetActionWorker.enqueueAction(context, WidgetActionWorker.ACTION_STOP)
    }
  }

  companion object {
    const val ACTION_PAUSE = "com.github.f462.klockin.PAUSE_TIMESHEET"
    const val ACTION_RESUME = "com.github.f462.klockin.RESUME_TIMESHEET"
    const val ACTION_STOP = "com.github.f462.klockin.STOP_TIMESHEET"
  }
}
