import random
from django.core.mail import EmailMessage
from .models import User, OneTimePassord
from django.conf import settings

def generateOtp():
    otp=""
    for i in range(6):
        otp += str(random.randint(1,9))
    return otp

def send_code_to_email_user(email):
    Subject="One time passcode for Email verification"
    otp_code=generateOtp()
    print(otp_code)
    
    # Aqui o Django traz um Objeto User do banco de dados
    user=User.objects.get(email=email) 
    current_site="myAuth.com"
    
    # 👇 CORREÇÃO AQUI: Trocado de user['full_name'] para user.full_name
    email_body=f"Olá {user.full_name}, obrigado por se cadastrar no {current_site}.\n\nO seu código de verificação é: {otp_code}\n\nPor favor, utilize este código para ativar a sua conta."
    
    from_email=settings.DEFAULT_FROM_EMAIL
    
    OneTimePassord.objects.create(user=user, code=otp_code)

    d_email=EmailMessage(subject=Subject, body=email_body, from_email=from_email, to=[email])
    d_email.send(fail_silently=True)