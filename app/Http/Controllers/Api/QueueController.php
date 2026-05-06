<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Officer;
use App\Models\OfficerActivity;
use App\Models\QueueNumber;
use App\Models\ServiceCategory;
use App\Services\QueueDayService;
use Illuminate\Http\Request;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class QueueController extends Controller
{
    public function __construct(
        private readonly QueueDayService $queueDayService,
    ) {
    }

    /**
     * Get all active queue (untuk Public Display)
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function active()
    {
        $this->queueDayService->prepareOperationalDay();

        $queues = QueueNumber::with(['serviceCategory', 'counter'])
            ->forOperationalDate()
            ->open()
            ->orderBy('service_category_id')
            ->orderBy('sequence_number')
            ->get()
            ->map(function ($queue) {
                return [
                    'id' => $queue->id,
                    'ticket_number' => $queue->ticket_number,
                    'service' => [
                        'code' => $queue->serviceCategory->code,
                        'name' => $queue->serviceCategory->name,
                    ],
                    'customer_name' => $queue->customer_name,
                    'identity_number' => $queue->identity_number,
                    'counter' => $queue->counter ? [
                        'id' => $queue->counter->id,
                        'code' => $queue->counter->full_code,
                        'number' => $queue->counter->counter_number,
                    ] : null,
                    'status' => $queue->status,
                    'created_at' => $queue->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $queues,
        ], 200);
    }

    /**
     * Generate new queue number
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function generate(Request $request)
    {
        $this->queueDayService->prepareOperationalDay();

        $request->validate([
            'service_category_id' => 'required|exists:service_categories,id',
            'customer_name' => 'nullable|string|max:255',
            'identity_number' => 'nullable|string|max:50',
        ]);

        $queue = DB::transaction(function () use ($request) {
            $category = ServiceCategory::findOrFail($request->service_category_id);
            $operationalDate = QueueNumber::operationalDate()->toDateString();

            // Generate ticket number per service per day.
            $nextSequenceNumber = QueueNumber::where('service_category_id', $category->id)
                ->whereDate('date', $operationalDate)
                ->lockForUpdate()
                ->max('sequence_number');

            $nextSequenceNumber = ((int) $nextSequenceNumber) + 1;
            $ticketNumber = QueueNumber::formatTicketNumber($category->code, $nextSequenceNumber);

            return QueueNumber::create([
                'service_category_id' => $category->id,
                'ticket_number' => $ticketNumber,
                'sequence_number' => $nextSequenceNumber,
                'tracking_code' => (string) Str::ulid(),
                'customer_name' => $request->customer_name,
                'identity_number' => $request->identity_number,
                'status' => 'WAITING',
                'date' => $operationalDate,
            ]);
        });

        $queue->load('serviceCategory');

        return response()->json([
            'success' => true,
            'message' => 'Nomor antrian berhasil dibuat',
            'data' => [
                'queue' => [
                    'id' => $queue->id,
                    'ticket_number' => $queue->ticket_number,
                    'customer_name' => $queue->customer_name,
                    'identity_number' => $queue->identity_number,
                    'service' => [
                        'code' => $queue->serviceCategory->code,
                        'name' => $queue->serviceCategory->name,
                        'description' => $queue->serviceCategory->description,
                    ],
                    'status' => $queue->status,
                    'created_at' => $queue->created_at,
                    'tracking_code' => $queue->tracking_code,
                    'tracking_url' => url("/track/{$queue->tracking_code}"),
                ],
            ],
        ], 201);
    }

    /**
     * Track queue status by ticket number for QR visitors.
     *
     * @param string $ticketNumber
     * @return \Illuminate\Http\JsonResponse
     */
    public function track(string $trackingKey)
    {
        $this->queueDayService->prepareOperationalDay();

        $queue = QueueNumber::with(['serviceCategory', 'counter'])
            ->where('tracking_code', $trackingKey)
            ->first();

        if (! $queue) {
            $queue = QueueNumber::with(['serviceCategory', 'counter'])
                ->where('ticket_number', strtoupper($trackingKey))
                ->forOperationalDate()
                ->first();
        }

        if (! $queue) {
            return response()->json([
                'success' => false,
                'message' => 'Nomor antrian tidak ditemukan untuk hari ini',
            ], 404);
        }

        $waitingAhead = 0;
        if ($queue->status === 'WAITING') {
            $waitingAhead = QueueNumber::where('service_category_id', $queue->service_category_id)
                ->where('date', $queue->date)
                ->where('status', 'WAITING')
                ->where('sequence_number', '<', $queue->sequence_number)
                ->count();
        }

        $currentQueue = QueueNumber::with('counter')
            ->where('service_category_id', $queue->service_category_id)
            ->where('date', $queue->date)
            ->current()
            ->orderByDesc('sequence_number')
            ->orderByDesc('called_at')
            ->orderByDesc('updated_at')
            ->first();

        $estimatedWaitMinutes = $queue->status === 'WAITING'
            ? max(0, ($waitingAhead + 1) * 5)
            : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'queue' => [
                    'id' => $queue->id,
                    'ticket_number' => $queue->ticket_number,
                    'customer_name' => $queue->customer_name,
                    'identity_number' => $queue->identity_number,
                    'status' => $queue->status,
                    'status_label' => $queue->status_label,
                    'created_at' => $queue->created_at,
                    'called_at' => $queue->called_at,
                    'served_at' => $queue->served_at,
                    'completed_at' => $queue->completed_at,
                    'tracking_code' => $queue->tracking_code,
                    'tracking_url' => url("/track/{$queue->tracking_code}"),
                ],
                'service' => [
                    'id' => $queue->serviceCategory->id,
                    'code' => $queue->serviceCategory->code,
                    'name' => $queue->serviceCategory->name,
                    'description' => $queue->serviceCategory->description,
                    'is_priority' => $queue->serviceCategory->is_priority,
                ],
                'counter' => $queue->counter ? [
                    'id' => $queue->counter->id,
                    'code' => $queue->counter->full_code,
                    'number' => $queue->counter->counter_number,
                ] : null,
                'current_queue' => $currentQueue ? [
                    'ticket_number' => $currentQueue->ticket_number,
                    'status' => $currentQueue->status,
                    'counter' => $currentQueue->counter?->full_code,
                ] : null,
                'progress' => [
                    'waiting_ahead' => $waitingAhead,
                    'estimated_wait_minutes' => $estimatedWaitMinutes,
                    'updated_at' => now(),
                ],
            ],
        ], 200);
    }

    /**
     * Call next queue (untuk Petugas)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function callNext(Request $request)
    {
        $this->queueDayService->prepareOperationalDay();

        $request->validate([
            'service_category_id' => 'required|exists:service_categories,id',
        ]);

        $officer = $request->user('sanctum');
        $counter = $officer->counter;

        if (! $counter) {
            return response()->json([
                'success' => false,
                'message' => 'Petugas belum ditugaskan ke loket',
            ], 422);
        }

        if ((int) $request->service_category_id !== (int) $counter->service_category_id) {
            return response()->json([
                'success' => false,
                'message' => 'Petugas hanya dapat memanggil antrian sesuai layanan loketnya',
            ], 422);
        }

        $nextQueue = DB::transaction(function () use ($officer, $request) {
            $activeQueue = QueueNumber::where('counter_id', $officer->counter_id)
                ->forOperationalDate()
                ->current()
                ->lockForUpdate()
                ->first();

            if ($activeQueue) {
                throw new HttpResponseException(response()->json([
                    'success' => false,
                    'message' => 'Masih ada antrian aktif di loket ini. Selesaikan atau lewati dulu sebelum memanggil nomor berikutnya.',
                ], 422));
            }

            $nextQueue = QueueNumber::where('service_category_id', $request->service_category_id)
                ->forOperationalDate()
                ->where('status', 'WAITING')
                ->orderBy('sequence_number')
                ->lockForUpdate()
                ->first();

            if (! $nextQueue) {
                return null;
            }

            $nextQueue->update([
                'status' => 'CALLING',
                'called_at' => now(),
                'counter_id' => $officer->counter_id,
            ]);

            return $nextQueue->refresh();
        });

        if (! $nextQueue) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada antrian yang menunggu',
            ], 404);
        }

        // Log activity
        OfficerActivity::create([
            'officer_id' => $officer->id,
            'queue_number_id' => $nextQueue->id,
            'action' => 'CALL_TICKET',
            'timestamp' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Antrian berhasil dipanggil',
            'data' => [
                'queue' => [
                    'id' => $nextQueue->id,
                    'ticket_number' => $nextQueue->ticket_number,
                    'customer_name' => $nextQueue->customer_name,
                    'identity_number' => $nextQueue->identity_number,
                    'status' => 'CALLING',
                    'called_at' => $nextQueue->called_at,
                    'counter' => [
                        'id' => $counter->id,
                        'code' => $counter->full_code,
                    ],
                ],
            ],
        ], 200);
    }

    /**
     * Serve ticket (update status ke SERVING)
     * 
     * @param Request $request
     * @param int $queueId
     * @return \Illuminate\Http\JsonResponse
     */
    public function serve(Request $request, int $queueId)
    {
        $this->queueDayService->prepareOperationalDay();

        $officer = $request->user('sanctum');
        $queue = QueueNumber::findOrFail($queueId);

        if (! $queue->date?->isSameDay(QueueNumber::operationalDate())) {
            return response()->json([
                'success' => false,
                'message' => 'Antrian ini bukan antrian aktif hari ini',
            ], 422);
        }

        if ($queue->counter_id !== $officer->counter_id) {
            return response()->json([
                'success' => false,
                'message' => 'Antrian ini tidak berada di loket petugas',
            ], 403);
        }

        if ($queue->status !== 'CALLING') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya antrian yang sedang dipanggil yang bisa masuk ke proses layanan',
            ], 422);
        }

        $queue->update([
            'status' => 'SERVING',
            'served_at' => now(),
        ]);

        OfficerActivity::create([
            'officer_id' => $officer->id,
            'queue_number_id' => $queue->id,
            'action' => 'CALL_TICKET',
            'timestamp' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Antrian sedang dilayani',
            'data' => ['queue' => $queue],
        ], 200);
    }

    /**
     * Complete ticket (selesai dilayani)
     * 
     * @param Request $request
     * @param int $queueId
     * @return \Illuminate\Http\JsonResponse
     */
    public function complete(Request $request, int $queueId)
    {
        $this->queueDayService->prepareOperationalDay();

        $officer = $request->user('sanctum');
        $queue = QueueNumber::findOrFail($queueId);

        if (! $queue->date?->isSameDay(QueueNumber::operationalDate())) {
            return response()->json([
                'success' => false,
                'message' => 'Antrian ini bukan antrian aktif hari ini',
            ], 422);
        }

        if ($queue->counter_id !== $officer->counter_id) {
            return response()->json([
                'success' => false,
                'message' => 'Antrian ini tidak berada di loket petugas',
            ], 403);
        }

        if ($queue->status !== 'SERVING') {
            return response()->json([
                'success' => false,
                'message' => 'Antrian harus berstatus sedang dilayani sebelum diselesaikan',
            ], 422);
        }

        $queue->update([
            'status' => 'SERVED',
            'completed_at' => now(),
            'wait_time_minutes' => $queue->calculateWaitTime(),
            'service_time_minutes' => $queue->calculateServiceTime(),
        ]);

        OfficerActivity::create([
            'officer_id' => $officer->id,
            'queue_number_id' => $queue->id,
            'action' => 'COMPLETE_TICKET',
            'timestamp' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Antrian selesai dilayani',
            'data' => [
                'queue' => [
                    'id' => $queue->id,
                    'ticket_number' => $queue->ticket_number,
                    'customer_name' => $queue->customer_name,
                    'identity_number' => $queue->identity_number,
                    'status' => 'SERVED',
                    'wait_time_minutes' => $queue->wait_time_minutes,
                    'service_time_minutes' => $queue->service_time_minutes,
                ],
            ],
        ], 200);
    }

    /**
     * Skip ticket
     * 
     * @param Request $request
     * @param int $queueId
     * @return \Illuminate\Http\JsonResponse
     */
    public function skip(Request $request, int $queueId)
    {
        $this->queueDayService->prepareOperationalDay();

        $officer = $request->user('sanctum');
        $queue = QueueNumber::findOrFail($queueId);

        if (! $queue->date?->isSameDay(QueueNumber::operationalDate())) {
            return response()->json([
                'success' => false,
                'message' => 'Antrian ini bukan antrian aktif hari ini',
            ], 422);
        }

        if ($queue->counter_id !== $officer->counter_id) {
            return response()->json([
                'success' => false,
                'message' => 'Antrian ini tidak berada di loket petugas',
            ], 403);
        }

        if (! in_array($queue->status, ['CALLING', 'SERVING'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya antrian aktif yang bisa dilewati',
            ], 422);
        }

        $queue->update([
            'status' => 'SKIPPED',
            'completed_at' => now(),
            'wait_time_minutes' => $queue->calculateWaitTime(),
        ]);

        OfficerActivity::create([
            'officer_id' => $officer->id,
            'queue_number_id' => $queue->id,
            'action' => 'SKIP_TICKET',
            'timestamp' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Antrian dilewati',
        ], 200);
    }

    /**
     * Get queue statistics untuk hari ini
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function statistics()
    {
        $this->queueDayService->prepareOperationalDay();

        $todayQueues = QueueNumber::forOperationalDate()->get();

        $stats = [
            'total_queues' => $todayQueues->count(),
            'completed' => $todayQueues->where('status', 'SERVED')->count(),
            'skipped' => $todayQueues->where('status', 'SKIPPED')->count(),
            'avg_wait_time' => round($todayQueues->whereNotNull('wait_time_minutes')->avg('wait_time_minutes'), 2),
            'avg_service_time' => round($todayQueues->whereNotNull('service_time_minutes')->avg('service_time_minutes'), 2),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ], 200);
    }
}
