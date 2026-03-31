<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IpAddress extends Model
{
    protected $fillable = [
        'ip_address',
        'ip_version',
        'label',
        'comment',
        'created_by',
    ];
}
