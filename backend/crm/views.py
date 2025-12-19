from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import Deal, UserProfile, Notification, ActivitySchedule
from .serializers import DealSerializer, UserSerializer, ActivityScheduleSerializer
from datetime import date, timedelta

class DealViewSet(viewsets.ModelViewSet):
    queryset = Deal.objects.all().order_by('-created_at')
    serializer_class = DealSerializer

    def perform_update(self, serializer):
        instance = serializer.instance
        old_stage = instance.stage
        updated_instance = serializer.save()
        
        if old_stage != updated_instance.stage:
            Notification.objects.create(
                message=f"CRM Move: {updated_instance.title} ({old_stage} -> {updated_instance.stage})",
                type="crm_move"
            )

class ActivityScheduleViewSet(viewsets.ModelViewSet):
    queryset = ActivitySchedule.objects.all().order_by('due_at')
    serializer_class = ActivityScheduleSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    data = request.data
    # Use email as username if username not provided
    if 'email' in data and 'username' not in data:
        data['username'] = data['email']
    
    serializer = UserSerializer(data=data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        # Ensure profile exists (signal should handle it, but safe check)
        if not hasattr(user, 'profile'):
            # Default to no access for new signups
            UserProfile.objects.create(user=user, allowed_apps="")
        else:
            # Explicitly set to empty if created by signal but we want to ensure no access
            user.profile.allowed_apps = ""
            user.profile.save()

        # Create notification for admins
        Notification.objects.create(
            message=f"New user registered: {user.email} ({user.first_name or 'No Name'})",
            type="signup"
        )
            
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not email or not password:
        return Response({'error': 'Please provide both email and password'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        username = user.username
    except User.DoesNotExist:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)
    
    if user:
        token, created = Token.objects.get_or_create(user=user)
        
        # Get allowed apps
        allowed_apps = ""
        profile_pic_url = None
        if hasattr(user, 'profile'):
            allowed_apps = user.profile.allowed_apps
            if user.profile.profile_picture:
                try:
                    profile_pic_url = request.build_absolute_uri(user.profile.profile_picture.url)
                except:
                    pass
        else:
            # Create if missing
            default_apps = "all" if user.is_staff else ""
            UserProfile.objects.create(user=user, allowed_apps=default_apps)
            allowed_apps = default_apps
            
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email,
            'name': user.first_name or user.username,
            'role': 'Admin' if user.is_staff else 'User',
            'allowed_apps': allowed_apps,
            'profile_picture': profile_pic_url
        })
    else:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_users(request):
    """
    Get all users and their allowed apps.
    Only accessible by Admin users.
    """
    users = User.objects.all().order_by('id')
    data = []
    for user in users:
        allowed = "all"
        if hasattr(user, 'profile'):
            allowed = user.profile.allowed_apps
        
        data.append({
            'id': user.id,
            'email': user.email,
            'name': user.first_name or user.username,
            'is_staff': user.is_staff,
            'allowed_apps': allowed
        })
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def update_user_permissions(request):
    """
    Update allowed apps for a user.
    """
    user_id = request.data.get('user_id')
    allowed_apps = request.data.get('allowed_apps')
    
    if not user_id:
        return Response({'error': 'User ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(id=user_id)
        if not hasattr(user, 'profile'):
            UserProfile.objects.create(user=user)
        
        user.profile.allowed_apps = allowed_apps
        user.profile.save()
        
        return Response({'success': True, 'message': 'Permissions updated'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def get_notifications(request):
    """
    Get recent notifications for admins.
    """
    # Check for upcoming due dates (next 3 days)
    upcoming_deals = Deal.objects.filter(
        expected_close__lte=date.today() + timedelta(days=3),
        expected_close__gte=date.today()
    )
    for deal in upcoming_deals:
        msg = f"Deal '{deal.title}' is due on {deal.expected_close}"
        # Avoid duplicate alerts for the same day
        if not Notification.objects.filter(message=msg, created_at__date=date.today()).exists():
             Notification.objects.create(message=msg, type="alert")

    # Get unread notifications or last 20
    notifications = Notification.objects.all().order_by('-created_at')[:20]
    data = []
    for n in notifications:
        data.append({
            'id': n.id,
            'message': n.message,
            'created_at': n.created_at,
            'is_read': n.is_read,
            'type': n.type
        })
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def mark_notification_read(request):
    """
    Mark a notification as read.
    """
    notif_id = request.data.get('id')
    if notif_id:
        try:
            n = Notification.objects.get(id=notif_id)
            n.is_read = True
            n.save()
            return Response({'success': True})
        except Notification.DoesNotExist:
            pass
    return Response({'error': 'Invalid ID'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_allowed_apps(request):
    user = request.user
    allowed = ""
    if hasattr(user, 'profile'):
        allowed = user.profile.allowed_apps
    else:
        default = "all" if user.is_staff else ""
        UserProfile.objects.create(user=user, allowed_apps=default)
        allowed = default
    return Response({'allowed_apps': allowed})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    data = request.data
    
    # Update basic info
    if 'name' in data:
        user.first_name = data['name']
    
    # Update email if provided and different
    if 'email' in data and data['email'] != user.email:
        if User.objects.filter(email=data['email']).exclude(id=user.id).exists():
            return Response({'error': 'Email already in use'}, status=status.HTTP_400_BAD_REQUEST)
        user.email = data['email']
        user.username = data['email']
    
    user.save()
    
    # Update profile fields
    if not hasattr(user, 'profile'):
        UserProfile.objects.create(user=user)
        
    # Handle profile picture
    if 'profile_picture' in request.FILES:
        user.profile.profile_picture = request.FILES['profile_picture']
        user.profile.save()
    
    # Construct image URL
    profile_pic_url = None
    if user.profile.profile_picture:
        try:
            profile_pic_url = request.build_absolute_uri(user.profile.profile_picture.url)
        except:
            pass

    return Response({
        'name': user.first_name,
        'email': user.email,
        'profile_picture': profile_pic_url
    })
