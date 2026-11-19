package com.github.f462.klockin

import android.content.Context
import android.content.Intent
import android.os.Bundle
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

/** Runs a widget action without bringing the React activity to the foreground. */
class WidgetActionService : HeadlessJsTaskService() {
  override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
    if (intent?.action != ACTION_TOGGLE_TIMESHEET) return null

    return HeadlessJsTaskConfig(
      TASK_NAME,
      Arguments.fromBundle(Bundle().apply { putString("action", "toggle") }),
      30_000,
      true,
    )
  }

  companion object {
    private const val ACTION_TOGGLE_TIMESHEET = "com.github.f462.klockin.TOGGLE_TIMESHEET"
    private const val TASK_NAME = "KlockinWidgetAction"

    fun start(context: Context) {
      acquireWakeLockNow(context)
      context.startService(
        Intent(context, WidgetActionService::class.java).setAction(ACTION_TOGGLE_TIMESHEET),
      )
    }
  }
}
