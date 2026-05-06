<?php

use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\CounterController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\OfficerAuthController;
use App\Http\Controllers\Api\OfficerController;
use App\Http\Controllers\Api\QueueController;
use App\Models\ServiceCategory;
use Illuminate\Support\Facades\Route;

/**
 * PUBLIC ROUTES (Tidak perlu authentication)
 */

Route::get('/services', function () {
    $services = ServiceCategory::orderBy('code')
        ->get(['id', 'code', 'name', 'description', 'is_priority', 'max_counters']);

    return response()->json([
        'success' => true,
        'data' => $services,
    ]);
});

// Queue Display (untuk Public Display halaman)
Route::prefix('/queue')->group(function () {
    Route::get('/active', [QueueController::class, 'active']);
    Route::post('/generate', [QueueController::class, 'generate']);
    Route::get('/track/{trackingKey}', [QueueController::class, 'track']);
    Route::get('/statistics', [QueueController::class, 'statistics']);
    Route::get('/public-dashboard', [DashboardController::class, 'public']);
});

/**
 * OFFICER ROUTES
 */

Route::prefix('/officer')->group(function () {
    // Auth routes
    Route::post('/login', [OfficerAuthController::class, 'login']);

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [OfficerAuthController::class, 'logout']);
        Route::get('/me', [OfficerAuthController::class, 'me']);
        Route::get('/dashboard', [DashboardController::class, 'officer']);

        // Queue management
        Route::prefix('/queue')->group(function () {
            Route::post('/call-next', [QueueController::class, 'callNext']);
            Route::post('/{queueId}/serve', [QueueController::class, 'serve']);
            Route::post('/{queueId}/complete', [QueueController::class, 'complete']);
            Route::post('/{queueId}/skip', [QueueController::class, 'skip']);
        });
    });
});

/**
 * ADMIN ROUTES
 */

Route::prefix('/admin')->group(function () {
    // Auth routes
    Route::post('/login', [AdminAuthController::class, 'login']);

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AdminAuthController::class, 'logout']);
        Route::get('/me', [AdminAuthController::class, 'me']);
        Route::get('/dashboard', [DashboardController::class, 'admin']);

        // Officers management
        Route::apiResource('officers', OfficerController::class);
        Route::post('/officers/{officer}/reset-password', [OfficerController::class, 'resetPassword']);

        // Counters management
        Route::apiResource('counters', CounterController::class);
        Route::patch('/counters/{counter}/status', [CounterController::class, 'updateStatus']);
        Route::post('/counters/{counter}/assign-officer', [CounterController::class, 'assignOfficer']);
    });
});
