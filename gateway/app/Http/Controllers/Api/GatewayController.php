<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GatewayController extends Controller
{
    public function auth(Request $request, ?string $path = null)
    {
        $baseUrl = rtrim((string) config('services.gateway.auth_url'), '/');
        $targetUrl = $baseUrl.'/api/'.ltrim($path ?? '', '/');

        return $this->forward($request, $targetUrl);
    }

    public function ip(Request $request, ?string $path = null)
    {
        $baseUrl = rtrim((string) config('services.gateway.ip_url'), '/');
        $targetUrl = $baseUrl.'/api/'.ltrim($path ?? '', '/');

        return $this->forward($request, $targetUrl);
    }

    private function forward(Request $request, string $targetUrl)
    {
        if ($targetUrl === '/api/') {
            return response()->json([
                'message' => 'Gateway target URL is not configured.',
            ], 500);
        }

        $headers = collect($request->headers->all())
            ->map(static fn ($values) => is_array($values) ? implode(', ', $values) : (string) $values)
            ->except(['host', 'content-length'])
            ->toArray();

        $client = Http::timeout(20)->withHeaders($headers);
        $contentType = $request->header('Content-Type');
        $rawBody = $request->getContent();

        if ($rawBody !== '' && $contentType) {
            $client = $client->withBody($rawBody, $contentType);
        }

        try {
            $upstream = $client->send($request->method(), $targetUrl, [
                'query' => $request->query(),
            ]);
        } catch (ConnectionException $e) {
            return response()->json([
                'message' => 'Gateway could not reach upstream service.',
            ], 502);
        }

        $responseHeaders = collect($upstream->headers())
            ->map(static fn ($values) => is_array($values) ? implode(', ', $values) : (string) $values)
            ->except(['transfer-encoding', 'content-encoding', 'connection'])
            ->toArray();

        return response($upstream->body(), $upstream->status())->withHeaders($responseHeaders);
    }
}
