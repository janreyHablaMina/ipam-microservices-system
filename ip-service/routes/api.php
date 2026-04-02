<?php

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\IpAddressController;
use Illuminate\Support\Facades\Route;

Route::middleware('jwt')->group(function () {
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
    Route::post('/ip-addresses', [IpAddressController::class, 'store']);
    Route::put('/ip-addresses/{id}', [IpAddressController::class, 'update']);
    Route::delete('/ip-addresses/{id}', [IpAddressController::class, 'destroy']);
});
