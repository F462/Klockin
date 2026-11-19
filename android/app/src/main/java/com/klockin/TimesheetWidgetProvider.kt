package com.github.f462.klockin

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.widget.RemoteViews
import java.util.Calendar

class TimesheetWidgetProvider : AppWidgetProvider() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == ACTION_TOGGLE_TIMESHEET) {
      WidgetActionService.start(context)
    } else if (intent.action == ACTION_REFRESH) {
      val manager = AppWidgetManager.getInstance(context)
      val component = android.content.ComponentName(context, TimesheetWidgetProvider::class.java)
      updateWidgets(context, manager, manager.getAppWidgetIds(component), scheduleRefresh = false)
    } else {
      super.onReceive(context, intent)
    }
  }

  override fun onDisabled(context: Context) {
    scheduleRefresh(context, false)
    super.onDisabled(context)
  }

  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    updateWidgets(context, manager, ids)
  }

  companion object {
    const val PREFERENCES_NAME = "timesheet_widget"
    private const val ACTION_REFRESH = "com.github.f462.klockin.REFRESH_WIDGET"
    private const val ACTION_TOGGLE_TIMESHEET = "com.github.f462.klockin.TOGGLE_TIMESHEET"

    fun updateWidgets(
      context: Context,
      manager: AppWidgetManager,
      ids: IntArray,
      scheduleRefresh: Boolean = true,
    ) {
      val preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
      val workedSeconds = preferences.getInt("workedSeconds", 0).coerceAtLeast(0)
      val active = preferences.getBoolean("active", false)
      val activeBeginAt = preferences.getLong("activeBeginAt", 0)
      val snapshotAt = preferences.getLong("snapshotAt", 0)
      val primaryContainer = preferences.getString("primaryContainer", "#D1FAE5") ?: "#D1FAE5"
      val parsedColor = runCatching { Color.parseColor(primaryContainer) }.getOrDefault(Color.rgb(209, 250, 229))
      val backgroundColor = Color.argb(204, Color.red(parsedColor), Color.green(parsedColor), Color.blue(parsedColor))
      val now = System.currentTimeMillis()
      val snapshotIsToday = isToday(snapshotAt, now)
      val activeStartedToday = isToday(activeBeginAt, now)
      val displayedSeconds = if (snapshotIsToday) {
        workedSeconds + if (active && activeStartedToday) ((now - snapshotAt) / 1000L).toInt().coerceAtLeast(0) else 0
      } else {
        0
      }
      if (scheduleRefresh) {
        scheduleRefresh(context, active && ids.isNotEmpty())
      }

      ids.forEach { widgetId ->
        val views = RemoteViews(context.packageName, R.layout.timesheet_widget)
        views.setInt(R.id.widget_root, "setBackgroundColor", backgroundColor)
        views.setTextViewText(R.id.static_duration, formatDuration(displayedSeconds))
        views.setImageViewResource(
          R.id.toggle_timesheet,
          if (active) R.drawable.ic_widget_stop else R.drawable.ic_widget_play,
        )

        val openAppIntent = Intent(context, MainActivity::class.java).apply {
          action = Intent.ACTION_VIEW
          data = Uri.parse("klockin://active-timesheet")
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        val openAppPendingIntent = PendingIntent.getActivity(
          context,
          3,
          openAppIntent,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        views.setOnClickPendingIntent(R.id.static_duration, openAppPendingIntent)

        val toggleIntent = Intent(context, TimesheetWidgetProvider::class.java).setAction(ACTION_TOGGLE_TIMESHEET)
        val togglePendingIntent = PendingIntent.getBroadcast(
          context,
          1,
          toggleIntent,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        views.setOnClickPendingIntent(R.id.toggle_timesheet, togglePendingIntent)
        manager.updateAppWidget(widgetId, views)
      }
    }

    private fun formatDuration(seconds: Int): String =
      "%02d:%02d".format(seconds / 3600, (seconds % 3600) / 60)

    private fun scheduleRefresh(context: Context, enabled: Boolean) {
      val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      val intent = Intent(context, TimesheetWidgetProvider::class.java).setAction(ACTION_REFRESH)
      val pendingIntent = PendingIntent.getBroadcast(
        context,
        2,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
      if (enabled) {
        alarmManager.setInexactRepeating(
          AlarmManager.RTC,
          System.currentTimeMillis() + 60_000L,
          60_000L,
          pendingIntent,
        )
      } else {
        alarmManager.cancel(pendingIntent)
      }
    }

    private fun isToday(timestamp: Long, now: Long): Boolean {
      if (timestamp <= 0) return false
      val timestampDate = Calendar.getInstance().apply { timeInMillis = timestamp }
      val currentDate = Calendar.getInstance().apply { timeInMillis = now }
      return timestampDate.get(Calendar.YEAR) == currentDate.get(Calendar.YEAR) &&
        timestampDate.get(Calendar.DAY_OF_YEAR) == currentDate.get(Calendar.DAY_OF_YEAR)
    }
  }
}
