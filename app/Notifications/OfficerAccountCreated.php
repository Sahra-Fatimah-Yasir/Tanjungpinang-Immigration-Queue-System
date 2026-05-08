<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
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

    public function toMail(object $notifiable): MailMessage
    {
        $roleLabel = $this->role === 'CS' ? 'Customer Service' : 'Officer Loket';

        return (new MailMessage)
            ->subject('Akun Petugas Sistem Antrian')
            ->greeting("Halo {$notifiable->name},")
            ->line('Akun petugas Anda untuk Sistem Antrian Kantor Imigrasi Kelas I TPI Tanjungpinang sudah dibuat.')
            ->line("Role: {$roleLabel}")
            ->line("Username / NIP: {$this->nip}")
            ->line("Password: {$this->temporaryPassword}")
            ->action('Login Officer', url('/officer/login'))
            ->line('Mohon simpan data login ini dengan aman dan jangan membagikannya kepada pihak lain.');
    }
}
