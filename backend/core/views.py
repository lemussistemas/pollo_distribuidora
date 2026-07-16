from django.contrib.auth import authenticate
from rest_framework import decorators, permissions, response, status
from rest_framework.authtoken.models import Token


def serialize_user(user):
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_staff': user.is_staff,
    }


@decorators.api_view(['POST'])
@decorators.permission_classes([permissions.AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)

    if user is None:
        return response.Response(
            {'detail': 'Usuario o contrasena incorrectos.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    token, _ = Token.objects.get_or_create(user=user)
    return response.Response({'token': token.key, 'user': serialize_user(user)})


@decorators.api_view(['POST'])
def logout_view(request):
    Token.objects.filter(user=request.user).delete()
    return response.Response({'detail': 'Sesion cerrada correctamente.'})


@decorators.api_view(['GET'])
def me_view(request):
    return response.Response({'user': serialize_user(request.user)})
