from django.shortcuts import render
from rest_framework.generics import GenericAPIView
from .serializers import UserRegisterSerializer, LoginSerializer, PasswordResetRequestSerializer, SetNewPasswordSerializer, LogoutUserSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .utils import send_code_to_email_user
from .models import OneTimePassord, User  # <-- CORREÇÃO 3: Importado o User
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import smart_str, DjangoUnicodeDecodeError
from django.contrib.auth.tokens import PasswordResetTokenGenerator

# Create your views here.

class RegisterUserView(GenericAPIView):
    serializer_class = UserRegisterSerializer

    def post(self, request):
        user_data = request.data
        serializer = self.serializer_class(data=user_data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            user = serializer.data
            send_code_to_email_user(user['email'])
            
            return Response({
                'data': user,
                # <-- CORREÇÃO 1: Aspas duplas por fora
                'message': f"Olá {user['full_name']}, obrigado por criar uma conta. Para ativá-la, valide seu e-mail clicando no link de confirmação ou inserindo o código de verificação enviado; se você não solicitou esta conta, ignore esta mensagem."
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class VerifyUserEmail(GenericAPIView):
    def post(self, request):
        # Atenção: No Postman, você deverá enviar o JSON com a chave "otp"
        otpcode = request.data.get('otp') 
        try:
            user_code_obj = OneTimePassord.objects.get(code=otpcode)
            user = user_code_obj.user
            if not user.is_verified:
                user.is_verified = True
                user.save()
                return Response({
                    'message': 'Endereço de email verificado com sucesso!' # (Corrigi 'messagem' para 'message')
                }, status=status.HTTP_200_OK)
                
            # <-- CORREÇÃO 4: Retornar 400 em vez de 204
            return Response({
                'message': 'Usuário já se encontra verificado!'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except OneTimePassord.DoesNotExist:
            return Response({'message':'Código de verificação inválido ou expirado'}, status=status.HTTP_404_NOT_FOUND)

class LoginUserView(GenericAPIView):
    serializer_class = LoginSerializer
    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class TestAuthenticationView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = {
            'msg': 'its works'
        }
        return Response(data, status=status.HTTP_200_OK)
    
class PasswordResetRequestView(GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        # <-- CORREÇÃO 2: Adicionado o return
        return Response({'message': "Um link foi enviado para seu email, para poder mudar de senha."}, status=status.HTTP_200_OK)

class PasswordResetConfirm(GenericAPIView):
    def get(self, request, uidb64, token):
        try:
            user_id = smart_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=user_id)
            if not PasswordResetTokenGenerator().check_token(user, token):
                return Response({'message':"O token é inválido ou foi expirado."}, status=status.HTTP_401_UNAUTHORIZED)
            return Response({'success': True, 'message':"Credenciais Válidas", 'uidb64':uidb64, 'token':token}, status=status.HTTP_200_OK)
        except DjangoUnicodeDecodeError:
            return Response({'message':"O token é inválido ou foi expirado."}, status=status.HTTP_401_UNAUTHORIZED)

class SetNewPassword(GenericAPIView):
    serializer_class = SetNewPasswordSerializer
    def patch(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({'message':"Senha mudada com sucesso!"}, status=status.HTTP_200_OK)
    
class LogoutUserView(GenericAPIView):
    serializer_class = LogoutUserSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)