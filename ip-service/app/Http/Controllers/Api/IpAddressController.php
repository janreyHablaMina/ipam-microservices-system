<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IpAddress;
use Illuminate\Http\Request;

class IpAddressController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'ip_address' => ['required', 'ip', 'max:45', 'unique:ip_addresses,ip_address'],
            'label' => ['required', 'string', 'max:150'],
            'comment' => ['nullable', 'string'],
        ]);

        $ipVersion = str_contains($validated['ip_address'], ':') ? 'ipv6' : 'ipv4';

        $ip = IpAddress::create([
            'ip_address' => $validated['ip_address'],
            'ip_version' => $ipVersion,
            'label' => $validated['label'],
            'comment' => $validated['comment'] ?? null,
            'created_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'IP address created successfully',
            'data' => $ip,
        ], 201);
    }
}
