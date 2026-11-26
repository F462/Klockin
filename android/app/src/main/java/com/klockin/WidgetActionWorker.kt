package com.github.f462.klockin

import android.content.Context
import android.os.Bundle
import androidx.work.Data
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequest
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.jstasks.HeadlessJsTaskConfig
import com.facebook.react.jstasks.HeadlessJsTaskContext
import com.facebook.react.jstasks.HeadlessJsTaskEventListener
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** Runs a widget action via WorkManager without requiring a background service or notification. */
class WidgetActionWorker(
  appContext: Context,
  params: WorkerParameters,
) : Worker(appContext, params) {
  private val latch = CountDownLatch(1)

  @Volatile
  private var activeTaskId: Int? = null

  @Volatile
  private var headlessContext: HeadlessJsTaskContext? = null

  @Volatile
  private var taskListener: HeadlessJsTaskEventListener? = null

  @Volatile
  private var instanceListener: ReactInstanceEventListener? = null

  override fun doWork(): Result {
    val action = inputData.getString(KEY_ACTION) ?: return Result.failure()
    if (action !in SUPPORTED_ACTIONS) return Result.failure()

    val reactApplication = applicationContext as? ReactApplication ?: return Result.failure()
    val reactHost = reactApplication.reactHost ?: return Result.failure()

    UiThreadUtil.runOnUiThread {
      if (isStopped) {
        latch.countDown()
        return@runOnUiThread
      }

      val currentContext = reactHost.currentReactContext
      if (currentContext != null) {
        startHeadlessTask(currentContext, action)
      } else {
        val listener = object : ReactInstanceEventListener {
          override fun onReactContextInitialized(context: ReactContext) {
            reactHost.removeReactInstanceEventListener(this)
            instanceListener = null
            if (!isStopped) {
              startHeadlessTask(context, action)
            } else {
              latch.countDown()
            }
          }
        }
        instanceListener = listener
        reactHost.addReactInstanceEventListener(listener)
        reactHost.start()
      }
    }

    val completed = latch.await(TASK_TIMEOUT_MS + 5_000L, TimeUnit.MILLISECONDS)
    cleanupListeners()
    return if (completed && !isStopped) Result.success() else Result.failure()
  }

  override fun onStopped() {
    super.onStopped()
    cleanupListeners()
    latch.countDown()
  }

  private fun startHeadlessTask(reactContext: ReactContext, action: String) {
    val context = HeadlessJsTaskContext.getInstance(reactContext)
    val listener = object : HeadlessJsTaskEventListener {
      override fun onHeadlessJsTaskStart(taskId: Int) = Unit

      override fun onHeadlessJsTaskFinish(taskId: Int) {
        if (taskId == activeTaskId) {
          context.removeTaskEventListener(this)
          taskListener = null
          latch.countDown()
        }
      }
    }

    headlessContext = context
    taskListener = listener
    context.addTaskEventListener(listener)

    val taskConfig = HeadlessJsTaskConfig(
      TASK_NAME,
      Arguments.fromBundle(Bundle().apply { putString("action", action) }),
      TASK_TIMEOUT_MS,
      true,
    )
    activeTaskId = context.startTask(taskConfig)
  }

  private fun cleanupListeners() {
    val currentHeadlessContext = headlessContext
    val currentTaskListener = taskListener
    if (currentHeadlessContext != null && currentTaskListener != null) {
      currentHeadlessContext.removeTaskEventListener(currentTaskListener)
    }
    headlessContext = null
    taskListener = null

    val currentInstanceListener = instanceListener
    if (currentInstanceListener != null) {
      val reactApplication = applicationContext as? ReactApplication
      reactApplication?.reactHost?.removeReactInstanceEventListener(currentInstanceListener)
      instanceListener = null
    }
  }

  companion object {
    private const val TASK_NAME = "KlockinWidgetAction"
    private const val TASK_TIMEOUT_MS = 30_000L
    private const val KEY_ACTION = "action"
    const val ACTION_TOGGLE = "toggle"
    const val ACTION_PAUSE = "pause"
    const val ACTION_RESUME = "resume"
    const val ACTION_STOP = "stop"
    private val SUPPORTED_ACTIONS = setOf(ACTION_TOGGLE, ACTION_PAUSE, ACTION_RESUME, ACTION_STOP)
    private const val UNIQUE_WORK_NAME = "klockin_widget_toggle"

    fun enqueueToggle(context: Context) {
      enqueueAction(context, ACTION_TOGGLE)
    }

    fun enqueueAction(context: Context, action: String) {
      if (action !in SUPPORTED_ACTIONS) {
        return
      }
      val request = OneTimeWorkRequest.Builder(WidgetActionWorker::class.java)
        .setInputData(Data.Builder().putString(KEY_ACTION, action).build())
        .build()
      WorkManager.getInstance(context).enqueueUniqueWork(
        UNIQUE_WORK_NAME,
        ExistingWorkPolicy.APPEND_OR_REPLACE,
        request,
      )
    }
  }
}
