<?php

use App\Notifications\OfficerAccountCreated;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('mail:test-officer {email} {--nip=198001012000010001} {--password=secret123} {--role=OFFICER}', function (string $email) {
    $mailer = config('mail.default');

    if (in_array($mailer, ['log', 'array'], true)) {
        $this->warn("MAIL_MAILER={$mailer}; email tidak akan masuk inbox. Atur SMTP dulu di .env.");
    }

    Notification::route('mail', $email)->notify(new OfficerAccountCreated(
        (string) $this->option('nip'),
        (string) $this->option('password'),
        (string) $this->option('role'),
    ));

    $this->info("Test email kredensial officer dikirim ke {$email} via mailer {$mailer}.");
})->purpose('Send a test officer credential email');
