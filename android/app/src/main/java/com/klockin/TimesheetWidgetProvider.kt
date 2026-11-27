package com.github.f462.klockin

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class TimesheetWidgetProvider : AppWidgetProvider() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == ACTION_TOGGLE_TIMESHEET) {
      WidgetActionWorker.enqueueToggle(context)
    } else if (TimesheetWidgetData.isRefreshIntent(intent)) {
      TimesheetWidgetData.refreshAll(context, scheduleRefresh = false)
    } else {
      super.onReceive(context, intent)
    }
  }

  override fun onDisabled(context: Context) {
    TimesheetWidgetData.scheduleRefresh(context, false)
    super.onDisabled(context)
  }

  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
    val state = TimesheetWidgetData.load(context)
    render(context, manager, ids, state)
    TimesheetWidgetData.scheduleRefresh(context, state.active && ids.isNotEmpty())
  }

  companion object {
    private const val ACTION_TOGGLE_TIMESHEET = "com.github.f462.klockin.TOGGLE_TIMESHEET"

    fun render(
      context: Context,
      manager: AppWidgetManager,
      ids: IntArray,
      state: TimesheetWidgetData.State,
    ) {
      ids.forEach { widgetId ->
        val views = RemoteViews(context.packageName, R.layout.timesheet_widget)
        views.setInt(R.id.widget_root, "setBackgroundColor", state.backgroundColor)
        views.setTextViewText(R.id.static_duration, TimesheetWidgetData.formatDuration(state.displayedSeconds))
        views.setImageViewResource(
          R.id.toggle_timesheet,
          if (state.active) R.drawable.ic_widget_stop else R.drawable.ic_widget_play,
        )

        val openAppPendingIntent = PendingIntent.getActivity(
          context,
          3,
          TimesheetWidgetData.openAppIntent(context),
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
  }
}
