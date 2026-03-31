<?php

use App\Http\Controllers\Api\IpAddressController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->group(function () {
    Route::post('/ip-addresses', [IpAddressController::class, 'store']);
});
