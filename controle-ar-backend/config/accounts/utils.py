import random
from django.core.mail import EmailMessage
from .models import User, OneTimePassord

def generateOtp():
    otp=""
    for i in range(6):
        otp += str(random.randint(1,9))
    return otp

def send_code_to_email_user(email):
    Subject="One time passcode for Email verification"
    otp_code=generateOtp()
    print(otp_code)
    user=User.objects.get(email=email)
    current_site="myAuth.com"
    email_body=f"Olá {user.full_name}, obrigado por se cadastrar no {current_site}, por favor, verifique seu e-mail!"
    from_email=settings.DEFAULT_FROM_EMAIL
    
    OneTimePassord.objects.create(user=user, code=otp_code)

    d_email=EmailMessage(subject=Subject, body=email_body, from_email=from_email, to=[email])
    d_email.send(fail_silently=True)