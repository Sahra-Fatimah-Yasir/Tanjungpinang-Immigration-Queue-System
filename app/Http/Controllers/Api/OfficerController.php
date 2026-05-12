<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Officer;
use App\Notifications\OfficerAccountCreated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Throwable;

class OfficerController extends Controller
{
    /**
     * Get all officers
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $officers = Officer::with('counter')
            ->get()
            ->map(function ($officer) {
                return [
                    'id' => $officer->id,
                    'nip' => $officer->nip,
                    'name' => $officer->name,
                    'email' => $officer->email,
                    'phone' => $officer->phone,
                    'status' => $officer->status,
                    'role' => $officer->role,
                    'counter' => $officer->counter ? [
                        'id' => $officer->counter->id,
                        'code' => $officer->counter->full_code,
                    ] : null,
                    'is_logged_in' => $officer->isLoggedIn(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $officers,
        ], 200);
    }

    public function show(int $officerId)
    {
        $officer = Officer::with('counter')->findOrFail($officerId);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $officer->id,
                'nip' => $officer->nip,
                'name' => $officer->name,
                'email' => $officer->email,
                'phone' => $officer->phone,
                'status' => $officer->status,
                'role' => $officer->role,
                'counter' => $officer->counter ? [
                    'id' => $officer->counter->id,
                    'code' => $officer->counter->full_code,
                ] : null,
                'is_logged_in' => $officer->isLoggedIn(),
            ],
        ], 200);
    }

    private function mailerCanSendToInbox(): bool
    {
        return ! in_array(config('mail.default'), ['log', 'array'], true);
    }

    /**
     * @return array{email_sent: bool, email_delivery_failed: bool, email_not_configured: bool, email_missing: bool}
     */
    private function sendAccountEmail(Officer $officer, string $plainPassword): array
    {
        $result = [
            'email_sent' => false,
            'email_delivery_failed' => false,
            'email_not_configured' => false,
            'email_missing' => false,
        ];

        if (! $officer->email) {
            $result['email_missing'] = true;

            return $result;
        }

        if (! $this->mailerCanSendToInbox()) {
            $result['email_not_configured'] = true;

            return $result;
        }

        try {
            $officer->notify(new OfficerAccountCreated(
                $officer->nip,
                $plainPassword,
                $officer->role,
            ));

            $result['email_sent'] = true;
        } catch (Throwable $exception) {
            $result['email_delivery_failed'] = true;

            Log::warning('Failed to send officer account email.', [
                'officer_id' => $officer->id,
                'email' => $officer->email,
                'error' => $exception->getMessage(),
            ]);
        }

        return $result;
    }

    /**
     * Create new officer
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'nip' => 'required|string|size:18|unique:officers',
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:officers',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6|confirmed',
            'counter_id' => 'nullable|exists:counters,id',
            'role' => 'nullable|in:OFFICER,CS',
        ]);

        $officer = Officer::create([
            'nip' => $request->nip,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'counter_id' => $request->counter_id,
            'status' => 'ACTIVE',
            'role' => $request->role ?? 'OFFICER',
        ]);

        $emailResult = $this->sendAccountEmail($officer, $request->password);

        return response()->json([
            'success' => true,
            'message' => $emailResult['email_sent']
                ? 'Petugas berhasil ditambahkan dan kredensial login sudah dikirim ke email.'
                : 'Petugas berhasil ditambahkan. Kredensial login belum terkirim ke email.',
            'data' => [
                'officer' => [
                    'id' => $officer->id,
                    'nip' => $officer->nip,
                    'name' => $officer->name,
                    'email' => $officer->email,
                    'role' => $officer->role,
                ],
                ...$emailResult,
            ],
        ], 201);
    }

    /**
     * Update officer info
     * 
     * @param Request $request
     * @param int $officerId
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, int $officerId)
    {
        $officer = Officer::findOrFail($officerId);

        $request->validate([
            'nip' => 'sometimes|string|size:18|unique:officers,nip,' . $officerId,
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|nullable|email|unique:officers,email,' . $officerId,
            'phone' => 'sometimes|nullable|string|max:20',
            'counter_id' => 'sometimes|nullable|exists:counters,id',
            'status' => 'sometimes|in:ACTIVE,INACTIVE,ON_BREAK',
            'role' => 'sometimes|in:OFFICER,CS',
        ]);

        $officer->update($request->only(['nip', 'name', 'email', 'phone', 'counter_id', 'status', 'role']));

        return response()->json([
            'success' => true,
            'message' => 'Petugas berhasil diperbarui',
            'data' => $officer,
        ], 200);
    }

    /**
     * Reset officer password (admin only)
     * 
     * @param Request $request
     * @param int $officerId
     * @return \Illuminate\Http\JsonResponse
     */
    public function resetPassword(Request $request, int $officerId)
    {
        $request->validate([
            'password' => 'required|string|min:6',
        ]);

        $officer = Officer::findOrFail($officerId);
        $officer->update(['password' => Hash::make($request->password)]);

        $emailResult = $this->sendAccountEmail($officer, $request->password);

        return response()->json([
            'success' => true,
            'message' => $emailResult['email_sent']
                ? 'Password petugas berhasil direset dan dikirim ke email.'
                : 'Password petugas berhasil direset. Email kredensial belum terkirim.',
            'data' => $emailResult,
        ], 200);
    }

    /**
     * Delete officer
     * 
     * @param int $officerId
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(int $officerId)
    {
        $officer = Officer::findOrFail($officerId);

        DB::transaction(function () use ($officer): void {
            $officer->tokens()->delete();
            $officer->activities()->delete();
            $officer->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Petugas berhasil dihapus',
        ], 200);
    }
}
