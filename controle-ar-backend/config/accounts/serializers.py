from rest_framework import serializers
from .models import User

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