from rest_framework import serializers
from .models import User
from django.contrib.auth import authenticate
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.sites.shortcuts import get_current_site
from django.utils.encoding import smart_str, smart_bytes, force_str
from django.urls import reverse
from .utils import send_normal_email
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken, Token

class UserRegisterSerializer(serializers.ModelSerializer):
    password=serializers.CharField(max_length=68, min_length=6, write_only=True)
    password2=serializers.CharField(max_length=68, min_length=6, write_only=True)

    class Meta:
        model=User
        fields=['email', 'full_name', 'password', 'password2']

    def validate(self, attrs):
        password= attrs.get('password', '')
        password2= attrs.get('password2', '')
        if password != password2:
            raise serializers.ValidationError("Senhas não coicidem!")
        return attrs
    
    def create(self, validated_data):
        user=User.objects.create_user(
            email=validated_data.get('email'),
            full_name=validated_data.get('full_name'),
            password=validated_data.get('password')
        )
        return user
    
class LoginSerializer(serializers.ModelSerializer):
    email=serializers.EmailField(max_length=255, min_length=6)
    password=serializers.CharField(max_length=68, write_only= True)
    full_name=serializers.CharField(max_length=255, read_only=True)
    access_token=serializers.CharField(max_length=255, read_only=True)
    refresh_token=serializers.CharField(max_length=255, read_only=True)

    class Meta:
        model=User
        fields=['email', 'password', 'full_name', 'access_token', 'refresh_token']

    def validate(self, attrs):
        email=attrs.get('email')
        password=attrs.get('password')
        request=self.context.get('request')
        user=authenticate(request, email=email, password=password)
        if not user:
            raise AuthenticationFailed("Credenciais Inválidas, tente novamente!")
        if not user.is_verified:
            raise AuthenticationFailed('O email não foi autenticado!')
        user_tokens = user.tokens()
        return {
            'email': user.email,
            'full_name': user.get_full_name,
            'access_token': str(user_tokens.get('access')),
            'refresh_token': str(user_tokens.get('refresh'))
        }

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)

    def validate(self, attrs):
        email = attrs.get('email')
        
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            uidb64 = urlsafe_base64_encode(smart_bytes(user.id))
            token = PasswordResetTokenGenerator().make_token(user)
            
            # 👇 A CORREÇÃO PRINCIPAL ESTÁ AQUI 👇
            # Coloque o endereço exato onde o seu React está a rodar (geralmente localhost:5173 no Vite)
            frontend_url = "http://localhost:5173"
            
            # Montamos o link apontando para a rota do React em vez do 'reverse' do Django
            abslink = f"{frontend_url}/reset-password/{uidb64}/{token}"
            
            email_body = f"Olá, use o link abaixo para mudar sua senha: \n {abslink}"
            
            data = {
                'email_body': email_body,
                'email_subject': "Mude sua Senha",
                'to_email': user.email
            }
            send_normal_email(data)
            
        return attrs

class SetNewPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(max_length=100, min_length=6, write_only=True)
    confirm_password = serializers.CharField(max_length=100, min_length=6, write_only=True)
    uidb64 = serializers.CharField(write_only=True)
    token = serializers.CharField(write_only=True)

    def validate(self, attrs):
        token = attrs.get('token')
        uidb64 = attrs.get('uidb64')
        password = attrs.get('password')
        confirm_password = attrs.get('confirm_password')

        # 1. Verifica se as senhas batem certo
        if password != confirm_password:
            raise serializers.ValidationError("As senhas não coincidem!")

        # 2. Tenta descodificar o ID do usuário
        try:
            user_id = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=user_id)
        except (ValueError, TypeError, DjangoUnicodeDecodeError, User.DoesNotExist):
            raise AuthenticationFailed("O link de mudança de senha é inválido ou mal formatado.")

        # 3. Verifica se o token do e-mail é válido
        if not PasswordResetTokenGenerator().check_token(user, token):
            raise AuthenticationFailed("O token de segurança é inválido ou já expirou.")

        # 4. Se passou por todas as barreiras, salva a nova senha!
        user.set_password(password)
        user.save()

        return attrs

class LogoutUserSerializer(serializers.Serializer):
    refresh_token=serializers.CharField()
    
    default_error_message={
        'bad_token':('O token é inválido ou expirou.')
    }
    def validate(self, attrs):
        self.token=attrs.get('refresh_token')
        return attrs

    def save(self, **kwargs):
        try:
            token=RefreshToken(self.token)
            token.blacklist()
        except TokenError:
            return self.fail('bad_token')