<?php

namespace App\Http\Controllers\Api;

use App\Events\QueueCalled;
use App\Events\QueueDashboardUpdated;
use App\Http\Controllers\Controller;
use App\Models\Officer;
use App\Models\OfficerActivity;
use App\Models\QueueNumber;
use App\Models\ServiceCategory;
use App\Services\QueueDayService;
use Carbon\CarbonImmutable;
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

    private function trackingUrl(Request $request, string $trackingCode): string
    {
        return rtrim($request->getSchemeAndHttpHost(), '/') . "/track/{$trackingCode}";
    }

    private function activityLabel(string $action): string
    {
        return match ($action) {
            'LOGIN' => 'Login',
            'LOGOUT' => 'Logout',
            'CALL_TICKET' => 'Panggil Antrian',
            'COMPLETE_TICKET' => 'Selesaikan Antrian',
            'SKIP_TICKET' => 'Lewati Antrian',
            'BREAK' => 'Istirahat',
            default => $action,
        };
    }

    private function averageMinutes($queues, string $column): ?float
    {
        $values = $queues
            ->map(function (QueueNumber $queue) use ($column) {
                return match ($column) {
                    'wait_time_minutes' => $queue->resolvedWaitTimeMinutes(),
                    'service_time_minutes' => $queue->resolvedServiceTimeMinutes(),
                    default => $queue->{$column} === null ? null : max(0, (float) $queue->{$column}),
                };
            })
            ->filter(fn ($value) => $value !== null);

        return $values->isEmpty() ? null : round((float) $values->avg(), 2);
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
        QueueDashboardUpdated::dispatch('created', $queue);

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
                    'tracking_url' => $this->trackingUrl($request, $queue->tracking_code),
                ],
            ],
        ], 201);
    }

    /**
     * Track queue status by QR tracking code.
     *
     * @param string $trackingKey
     * @return \Illuminate\Http\JsonResponse
     */
    public function track(Request $request, string $trackingKey)
    {
        $this->queueDayService->prepareOperationalDay();

        $queue = QueueNumber::with(['serviceCategory', 'counter'])
            ->where('tracking_code', $trackingKey)
            ->first();

        if (! $queue) {
            return response()->json([
                'success' => false,
                'message' => 'Tracking antrian tidak ditemukan',
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
                    'tracking_url' => $this->trackingUrl($request, $queue->tracking_code),
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
        $service = ServiceCategory::findOrFail($request->service_category_id);

        if (! $counter) {
            return response()->json([
                'success' => false,
                'message' => 'Petugas belum ditugaskan ke loket',
            ], 422);
        }

        if ((int) $service->id !== (int) $counter->service_category_id && ! $service->is_priority) {
            return response()->json([
                'success' => false,
                'message' => 'Petugas hanya dapat memanggil antrian layanan loketnya atau layanan prioritas',
            ], 422);
        }

        $nextQueue = DB::transaction(function () use ($officer, $service) {
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

            $nextQueue = QueueNumber::where('service_category_id', $service->id)
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

        $nextQueue->loadMissing('serviceCategory');

        // Log activity
        $activity = OfficerActivity::create([
            'officer_id' => $officer->id,
            'queue_number_id' => $nextQueue->id,
            'action' => 'CALL_TICKET',
            'timestamp' => now(),
        ]);
        QueueCalled::dispatch($activity);

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
                    'service' => [
                        'id' => $nextQueue->serviceCategory->id,
                        'code' => $nextQueue->serviceCategory->code,
                        'name' => $nextQueue->serviceCategory->name,
                        'is_priority' => $nextQueue->serviceCategory->is_priority,
                    ],
                    'counter' => [
                        'id' => $counter->id,
                        'code' => $counter->full_code,
                        'number' => $counter->counter_number,
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
        QueueDashboardUpdated::dispatch('served', $queue->refresh());

        return response()->json([
            'success' => true,
            'message' => 'Antrian sedang dilayani',
            'data' => ['queue' => $queue],
        ], 200);
    }

    public function repeat(Request $request, int $queueId)
    {
        $this->queueDayService->prepareOperationalDay();

        $officer = $request->user('sanctum');
        $queue = QueueNumber::with(['serviceCategory', 'counter'])->findOrFail($queueId);

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
                'message' => 'Hanya antrian aktif yang bisa dipanggil ulang',
            ], 422);
        }

        $activity = OfficerActivity::create([
            'officer_id' => $officer->id,
            'queue_number_id' => $queue->id,
            'action' => 'CALL_TICKET',
            'timestamp' => now(),
        ]);
        QueueCalled::dispatch($activity);

        return response()->json([
            'success' => true,
            'message' => 'Antrian berhasil dipanggil ulang',
            'data' => [
                'queue' => [
                    'id' => $queue->id,
                    'ticket_number' => $queue->ticket_number,
                    'customer_name' => $queue->customer_name,
                    'identity_number' => $queue->identity_number,
                    'status' => $queue->status,
                    'called_at' => $queue->called_at,
                    'service' => [
                        'id' => $queue->serviceCategory->id,
                        'code' => $queue->serviceCategory->code,
                        'name' => $queue->serviceCategory->name,
                        'is_priority' => $queue->serviceCategory->is_priority,
                    ],
                    'counter' => [
                        'id' => $queue->counter?->id,
                        'code' => $queue->counter?->full_code,
                        'number' => $queue->counter?->counter_number,
                    ],
                ],
            ],
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
        QueueDashboardUpdated::dispatch('completed', $queue->refresh());

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
        QueueDashboardUpdated::dispatch('skipped', $queue->refresh());

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
            'avg_wait_time' => $this->averageMinutes($todayQueues, 'wait_time_minutes'),
            'avg_service_time' => $this->averageMinutes($todayQueues, 'service_time_minutes'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ], 200);
    }

    /**
     * Get complete queue report data for Excel export.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function report(Request $request)
    {
        $this->queueDayService->prepareOperationalDay();

        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $from = isset($validated['from'])
            ? CarbonImmutable::parse($validated['from'])->startOfDay()
            : QueueNumber::operationalDate();
        $to = isset($validated['to'])
            ? CarbonImmutable::parse($validated['to'])->startOfDay()
            : $from;

        if ($to->lt($from)) {
            return response()->json([
                'success' => false,
                'message' => 'Tanggal akhir tidak boleh lebih awal dari tanggal awal.',
            ], 422);
        }

        $queues = QueueNumber::with([
                'serviceCategory',
                'counter.serviceCategory',
                'activities.officer',
            ])
            ->whereDate('date', '>=', $from->toDateString())
            ->whereDate('date', '<=', $to->toDateString())
            ->orderBy('date')
            ->orderBy('service_category_id')
            ->orderBy('sequence_number')
            ->get();

        $summary = [
            'total_queues' => $queues->count(),
            'waiting' => $queues->where('status', 'WAITING')->count(),
            'calling' => $queues->where('status', 'CALLING')->count(),
            'serving' => $queues->where('status', 'SERVING')->count(),
            'completed' => $queues->where('status', 'SERVED')->count(),
            'skipped' => $queues->where('status', 'SKIPPED')->count(),
            'avg_wait_time' => $this->averageMinutes($queues, 'wait_time_minutes'),
            'avg_service_time' => $this->averageMinutes($queues, 'service_time_minutes'),
        ];

        $byService = $queues
            ->groupBy('service_category_id')
            ->map(function ($serviceQueues) {
                $service = $serviceQueues->first()->serviceCategory;

                return [
                    'service_id' => $service?->id,
                    'service_code' => $service?->code,
                    'service_name' => $service?->name,
                    'is_priority' => (bool) ($service?->is_priority ?? false),
                    'total_queues' => $serviceQueues->count(),
                    'waiting' => $serviceQueues->where('status', 'WAITING')->count(),
                    'calling' => $serviceQueues->where('status', 'CALLING')->count(),
                    'serving' => $serviceQueues->where('status', 'SERVING')->count(),
                    'completed' => $serviceQueues->where('status', 'SERVED')->count(),
                    'skipped' => $serviceQueues->where('status', 'SKIPPED')->count(),
                    'avg_wait_time' => $this->averageMinutes($serviceQueues, 'wait_time_minutes'),
                    'avg_service_time' => $this->averageMinutes($serviceQueues, 'service_time_minutes'),
                ];
            })
            ->sortBy('service_code')
            ->values();

        $queueRows = $queues->map(function (QueueNumber $queue) use ($request) {
            $activities = $queue->activities
                ->sortBy('timestamp')
                ->values();
            $calledActivity = $activities->firstWhere('action', 'CALL_TICKET');
            $completedActivity = $activities->firstWhere('action', 'COMPLETE_TICKET');
            $skippedActivity = $activities->firstWhere('action', 'SKIP_TICKET');
            $lastActivity = $activities->filter(fn ($activity) => $activity->officer !== null)->last();

            return [
                'id' => $queue->id,
                'ticket_number' => $queue->ticket_number,
                'sequence_number' => $queue->sequence_number,
                'tracking_code' => $queue->tracking_code,
                'tracking_url' => $queue->tracking_code ? $this->trackingUrl($request, $queue->tracking_code) : null,
                'customer_name' => $queue->customer_name,
                'identity_number' => $queue->identity_number,
                'status' => $queue->status,
                'status_label' => $queue->status_label,
                'date' => $queue->date?->toDateString(),
                'created_at' => $queue->created_at?->toIso8601String(),
                'called_at' => $queue->called_at?->toIso8601String(),
                'served_at' => $queue->served_at?->toIso8601String(),
                'completed_at' => $queue->completed_at?->toIso8601String(),
                'updated_at' => $queue->updated_at?->toIso8601String(),
                'wait_time_minutes' => $queue->resolvedWaitTimeMinutes(),
                'service_time_minutes' => $queue->resolvedServiceTimeMinutes(),
                'total_time_minutes' => $queue->calculateTotalTime(),
                'service' => [
                    'id' => $queue->serviceCategory?->id,
                    'code' => $queue->serviceCategory?->code,
                    'name' => $queue->serviceCategory?->name,
                    'description' => $queue->serviceCategory?->description,
                    'is_priority' => (bool) ($queue->serviceCategory?->is_priority ?? false),
                    'max_counters' => $queue->serviceCategory?->max_counters,
                ],
                'counter' => $queue->counter ? [
                    'id' => $queue->counter->id,
                    'code' => $queue->counter->full_code,
                    'number' => $queue->counter->counter_number,
                    'status' => $queue->counter->status,
                    'service_code' => $queue->counter->serviceCategory?->code,
                    'service_name' => $queue->counter->serviceCategory?->name,
                ] : null,
                'officers' => [
                    'called_by' => $calledActivity?->officer ? [
                        'id' => $calledActivity->officer->id,
                        'nip' => $calledActivity->officer->nip,
                        'name' => $calledActivity->officer->name,
                    ] : null,
                    'completed_by' => $completedActivity?->officer ? [
                        'id' => $completedActivity->officer->id,
                        'nip' => $completedActivity->officer->nip,
                        'name' => $completedActivity->officer->name,
                    ] : null,
                    'skipped_by' => $skippedActivity?->officer ? [
                        'id' => $skippedActivity->officer->id,
                        'nip' => $skippedActivity->officer->nip,
                        'name' => $skippedActivity->officer->name,
                    ] : null,
                    'last_handled_by' => $lastActivity?->officer ? [
                        'id' => $lastActivity->officer->id,
                        'nip' => $lastActivity->officer->nip,
                        'name' => $lastActivity->officer->name,
                    ] : null,
                ],
                'activities' => $activities->map(fn ($activity) => [
                    'id' => $activity->id,
                    'action' => $activity->action,
                    'action_label' => $this->activityLabel($activity->action),
                    'notes' => $activity->notes,
                    'timestamp' => $activity->timestamp?->toIso8601String(),
                    'officer' => $activity->officer ? [
                        'id' => $activity->officer->id,
                        'nip' => $activity->officer->nip,
                        'name' => $activity->officer->name,
                        'email' => $activity->officer->email,
                        'phone' => $activity->officer->phone,
                        'role' => $activity->officer->role,
                    ] : null,
                ])->values(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'date_range' => [
                    'from' => $from->toDateString(),
                    'to' => $to->toDateString(),
                    'generated_at' => now()->toIso8601String(),
                ],
                'summary' => $summary,
                'by_service' => $byService,
                'queues' => $queueRows,
            ],
        ], 200);
    }
}
