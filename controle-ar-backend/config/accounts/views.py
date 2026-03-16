from django.shortcuts import render
from rest_framework.generics import GenericAPIView
from .serializers import UserRegisterSerializer
from rest_framework.response import Response
from rest_framework import status
from .utils import send_code_to_email_user
# Create your views here.

class RegisterUserView(GenericAPIView):
    serializer_class=UserRegisterSerializer

    def post(self, request):
        user_data=request.data
        serializer=self.serializer_class(data=user_data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            user=serializer.data
            send_code_to_email_user(user['email'])
            # enviando email com a fuction user['email']
            return Response({
                'data': user,
                'message':f'Olá {user.full_name}, obrigado por criar uma conta. Para ativá-la, valide seu e-mail clicando no link de confirmação ou inserindo o código de verificação enviado; se você não solicitou esta conta, ignore esta mensagem.'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)