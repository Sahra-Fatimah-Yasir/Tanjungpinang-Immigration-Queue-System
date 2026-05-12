<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Counter;
use App\Models\Officer;
use App\Models\ServiceCategory;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CounterController extends Controller
{
    /**
     * Get all counters dengan info service category
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $counters = Counter::with(['serviceCategory', 'officer'])
            ->orderBy('code')
            ->orderBy('counter_number')
            ->get()
            ->map(function ($counter) {
                return [
                    'id' => $counter->id,
                    'code' => $counter->full_code,
                    'counter_number' => $counter->counter_number,
                    'service' => [
                        'id' => $counter->serviceCategory->id,
                        'code' => $counter->serviceCategory->code,
                        'name' => $counter->serviceCategory->name,
                    ],
                    'officer' => $counter->officer ? [
                        'id' => $counter->officer->id,
                        'nip' => $counter->officer->nip,
                        'name' => $counter->officer->name,
                    ] : null,
                    'status' => $counter->status,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $counters,
        ], 200);
    }

    public function show(int $counterId)
    {
        $counter = Counter::with(['serviceCategory', 'officer'])->findOrFail($counterId);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $counter->id,
                'code' => $counter->full_code,
                'counter_number' => $counter->counter_number,
                'service' => [
                    'id' => $counter->serviceCategory->id,
                    'code' => $counter->serviceCategory->code,
                    'name' => $counter->serviceCategory->name,
                ],
                'officer' => $counter->officer ? [
                    'id' => $counter->officer->id,
                    'nip' => $counter->officer->nip,
                    'name' => $counter->officer->name,
                ] : null,
                'status' => $counter->status,
            ],
        ], 200);
    }

    public function update(Request $request, int $counterId)
    {
        $counter = Counter::findOrFail($counterId);

        $request->validate([
            'counter_number' => [
                'sometimes',
                'integer',
                'min:1',
                'max:10',
                Rule::unique('counters', 'counter_number')
                    ->ignore($counter->id)
                    ->where(fn ($query) => $query->where('service_category_id', $counter->service_category_id)),
            ],
            'status' => 'sometimes|in:ACTIVE,INACTIVE,MAINTENANCE',
        ]);

        $counter->update($request->only([
            'counter_number',
            'status',
        ]));

        $counter->refresh()->load(['serviceCategory', 'officer']);

        return response()->json([
            'success' => true,
            'message' => 'Loket berhasil diperbarui',
            'data' => [
                'id' => $counter->id,
                'code' => $counter->full_code,
                'counter_number' => $counter->counter_number,
                'service' => [
                    'id' => $counter->serviceCategory->id,
                    'code' => $counter->serviceCategory->code,
                    'name' => $counter->serviceCategory->name,
                ],
                'officer' => $counter->officer ? [
                    'id' => $counter->officer->id,
                    'nip' => $counter->officer->nip,
                    'name' => $counter->officer->name,
                ] : null,
                'status' => $counter->status,
            ],
        ], 200);
    }
    /**
     * Create new counter
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'service_category_id' => 'required|exists:service_categories,id',
            'counter_number' => [
                'required',
                'integer',
                'min:1',
                'max:10',
                Rule::unique('counters', 'counter_number')
                    ->where(fn ($query) => $query->where('service_category_id', $request->service_category_id)),
            ],
            'status' => 'nullable|in:ACTIVE,INACTIVE,MAINTENANCE',
            'officer_id' => 'nullable|exists:officers,id',
        ]);

        $counter = Counter::create([
            'service_category_id' => $request->service_category_id,
            'counter_number' => $request->counter_number,
            'code' => ServiceCategory::find($request->service_category_id)->code,
            'status' => $request->status ?? 'ACTIVE',
        ]);

        if ($request->filled('officer_id')) {
            $this->assignOfficerToCounter($counter, (int) $request->officer_id);
        }

        $counter->refresh()->load(['serviceCategory', 'officer']);

        return response()->json([
            'success' => true,
            'message' => 'Loket berhasil dibuat',
            'data' => [
                'id' => $counter->id,
                'code' => $counter->full_code,
                'counter_number' => $counter->counter_number,
                'service' => [
                    'id' => $counter->serviceCategory->id,
                    'code' => $counter->serviceCategory->code,
                    'name' => $counter->serviceCategory->name,
                ],
                'officer' => $counter->officer ? [
                    'id' => $counter->officer->id,
                    'nip' => $counter->officer->nip,
                    'name' => $counter->officer->name,
                ] : null,
                'status' => $counter->status,
            ],
        ], 201);
    }

    /**
     * Update counter status
     * 
     * @param Request $request
     * @param int $counterId
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateStatus(Request $request, int $counterId)
    {
        $request->validate([
            'status' => 'required|in:ACTIVE,INACTIVE,MAINTENANCE',
        ]);

        $counter = Counter::findOrFail($counterId);
        $counter->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'Status loket berhasil diperbarui',
            'data' => $counter,
        ], 200);
    }

    /**
     * Assign officer to counter
     * 
     * @param Request $request
     * @param int $counterId
     * @return \Illuminate\Http\JsonResponse
     */
    public function assignOfficer(Request $request, int $counterId)
    {
        $request->validate([
            'officer_id' => 'nullable|exists:officers,id',
        ]);

        $counter = Counter::findOrFail($counterId);

        Officer::where('counter_id', $counter->id)->update([
            'counter_id' => null,
        ]);

        $officer = null;
        $message = 'Penugasan petugas pada loket berhasil dihapus';

        if ($request->filled('officer_id')) {
            $officer = $this->assignOfficerToCounter($counter, (int) $request->officer_id);
            $message = 'Petugas berhasil ditugaskan ke loket';
        }

        $counter->refresh();

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'counter' => [
                    'id' => $counter->id,
                    'code' => $counter->full_code,
                    'counter_number' => $counter->counter_number,
                    'status' => $counter->status,
                ],
                'officer' => $officer ? [
                    'id' => $officer->id,
                    'nip' => $officer->nip,
                    'name' => $officer->name,
                ] : null,
            ],
        ], 200);
    }

    /**
     * Delete counter
     * 
     * @param int $counterId
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(int $counterId)
    {
        $counter = Counter::findOrFail($counterId);
        
        // Check if counter has active queues
        $activeQueues = $counter->queueNumbers()
            ->where('date', today())
            ->whereNotIn('status', ['SERVED', 'SKIPPED'])
            ->count();

        if ($activeQueues > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat menghapus loket yang memiliki antrian aktif',
            ], 400);
        }

        DB::transaction(function () use ($counter): void {
            Officer::where('counter_id', $counter->id)->update([
                'counter_id' => null,
            ]);

            $counter->queueNumbers()->update([
                'counter_id' => null,
            ]);

            $counter->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Loket berhasil dihapus',
        ], 200);
    }

    private function assignOfficerToCounter(Counter $counter, int $officerId): Officer
    {
        $officer = Officer::findOrFail($officerId);

        if ($officer->role !== 'OFFICER') {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Hanya officer loket yang dapat ditugaskan ke counter',
            ], 422));
        }

        if ($officer->status !== 'ACTIVE') {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Officer harus berstatus aktif untuk ditugaskan ke counter',
            ], 422));
        }

        $officer->update([
            'counter_id' => $counter->id,
        ]);

        return $officer;
    }
}
