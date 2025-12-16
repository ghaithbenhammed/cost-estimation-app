from chat.models import Notification
from django.core.mail import send_mail
from django.conf import settings

def notify_user(user, content, email_subject=None):
    print(f"[notify_user] Notification créée pour : {user.email} / Sujet : {email_subject}")

    if not user or not user.email:
        print("[notify_user] Utilisateur ou email manquant")
        return

    Notification.objects.create(user=user, content=content)

    if email_subject:
        try:
            send_mail(
                subject=email_subject,
                message=content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True
            )
            print("[notify_user] Mail envoyé ✔")
        except Exception as e:
            print(f"[notify_user] ❌ Erreur envoi mail : {e}")
