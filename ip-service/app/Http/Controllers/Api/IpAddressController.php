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
        $creatorId = (int) $request->attributes->get('auth_user_id');

        $ip = IpAddress::create([
            'ip_address' => $validated['ip_address'],
            'ip_version' => $ipVersion,
            'label' => $validated['label'],
            'comment' => $validated['comment'] ?? null,
            'created_by' => $creatorId,
        ]);

        return response()->json([
            'message' => 'IP address created successfully',
            'data' => $ip,
        ], 201);
    }

    public function update(Request $request, int $id)
    {
        $validated = $request->validate([
            'ip_address' => ['sometimes', 'required', 'ip', 'max:45', 'unique:ip_addresses,ip_address,'.$id],
            'label' => ['sometimes', 'required', 'string', 'max:150'],
            'comment' => ['nullable', 'string'],
        ]);

        $ip = IpAddress::findOrFail($id);
        $authUserId = (int) $request->attributes->get('auth_user_id');
        $authUserRole = (string) $request->attributes->get('auth_user_role', 'user');

        if ($authUserRole !== 'super_admin' && $ip->created_by !== $authUserId) {
            return response()->json([
                'message' => 'Forbidden: you can only update your own IP addresses.',
            ], 403);
        }

        if (array_key_exists('ip_address', $validated)) {
            $validated['ip_version'] = str_contains($validated['ip_address'], ':') ? 'ipv6' : 'ipv4';
        }

        $ip->update($validated);

        return response()->json([
            'message' => 'IP address updated successfully',
            'data' => $ip->fresh(),
        ]);
    }

    public function destroy(Request $request, int $id)
    {
        $authUserRole = (string) $request->attributes->get('auth_user_role', 'user');

        if ($authUserRole !== 'super_admin') {
            return response()->json([
                'message' => 'Forbidden: only super_admin can delete IP addresses.',
            ], 403);
        }

        $ip = IpAddress::find($id);

        if (! $ip) {
            return response()->json([
                'message' => 'IP address not found.',
            ], 404);
        }

        $ip->delete();

        return response()->json([
            'message' => 'IP address deleted successfully.',
        ], 200);
    }
}
