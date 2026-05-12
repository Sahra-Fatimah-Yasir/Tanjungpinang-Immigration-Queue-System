<?php

namespace App\Notifications;

use App\Mail\OfficerAccountCreatedMail;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OfficerAccountCreated extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $nip,
        private readonly string $temporaryPassword,
        private readonly string $role,
    ) {
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): OfficerAccountCreatedMail
    {
        $name = $notifiable->name ?? 'Petugas';
        $roleLabel = $this->role === 'CS' ? 'Customer Service' : 'Officer Loket';
        $officeName = 'Kantor Imigrasi Kelas I TPI Tanjungpinang';

        $mail = new OfficerAccountCreatedMail(
            name: $name,
            officeName: $officeName,
            roleLabel: $roleLabel,
            nip: $this->nip,
            temporaryPassword: $this->temporaryPassword,
            loginUrl: url('/officer/login'),
            logoPath: public_path('images/logo.png'),
        );

        $recipient = method_exists($notifiable, 'routeNotificationFor')
            ? $notifiable->routeNotificationFor('mail')
            : ($notifiable->email ?? null);

        if ($recipient) {
            $mail->to($recipient);
        }

        return $mail;
    }
}
