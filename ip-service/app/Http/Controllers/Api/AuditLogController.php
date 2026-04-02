<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $authUserRole = (string) $request->attributes->get('auth_user_role', 'user');

        if ($authUserRole !== 'super_admin') {
            return response()->json([
                'message' => 'Forbidden: only super_admin can view audit logs.',
            ], 403);
        }

        $validated = $request->validate([
            'action' => ['nullable', 'in:create,update,delete,login'],
            'user_id' => ['nullable', 'integer', 'min:1'],
            'entity_id' => ['nullable', 'integer', 'min:1'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'q' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'in:latest,oldest'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = AuditLog::query();

        if (! empty($validated['action'])) {
            $query->where('action', $validated['action']);
        }

        if (! empty($validated['user_id'])) {
            $query->where('user_id', (int) $validated['user_id']);
        }

        if (! empty($validated['entity_id'])) {
            $query->where('entity_id', (int) $validated['entity_id']);
        }

        if (! empty($validated['from'])) {
            $query->whereDate('created_at', '>=', $validated['from']);
        }

        if (! empty($validated['to'])) {
            $query->whereDate('created_at', '<=', $validated['to']);
        }

        if (! empty($validated['q'])) {
            $search = $validated['q'];
            $query->where(function ($subQuery) use ($search) {
                $subQuery->where('entity_type', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%")
                    ->orWhereRaw("CAST(new_values AS TEXT) ILIKE ?", ["%{$search}%"])
                    ->orWhereRaw("CAST(old_values AS TEXT) ILIKE ?", ["%{$search}%"]);
            });
        }

        $sort = $validated['sort'] ?? 'latest';
        $query->orderBy('created_at', $sort === 'oldest' ? 'asc' : 'desc');

        $perPage = (int) ($validated['per_page'] ?? 20);
        $logs = $query->paginate($perPage)->withQueryString();

        return response()->json([
            'data' => $logs->items(),
            'meta' => [
                'page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'total_pages' => $logs->lastPage(),
                'sort' => $sort,
            ],
        ]);
    }
}
