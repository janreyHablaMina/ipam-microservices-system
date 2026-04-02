<?php

use App\Http\Controllers\Api\GatewayController;
use Illuminate\Support\Facades\Route;

Route::any('/auth/{path?}', [GatewayController::class, 'auth'])
    ->where('path', '.*');

Route::any('/ip/{path?}', [GatewayController::class, 'ip'])
    ->where('path', '.*');
