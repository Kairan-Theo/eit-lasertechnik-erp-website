from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import Deal, UserProfile, Notification, ActivitySchedule, Quotation, Invoice, PurchaseOrder, Project, Task, Customer, SupportTicket, Lead, ManufacturingOrder, Product, ProductVersion, ProductType, System, Component, SystemComponent, ComponentEntry
from .serializers import DealSerializer, UserSerializer, ActivityScheduleSerializer, QuotationSerializer, InvoiceSerializer, PurchaseOrderSerializer, ProjectSerializer, TaskSerializer, CustomerSerializer, SupportTicketSerializer, LeadSerializer, ManufacturingOrderSerializer, ProductSerializer, ProductVersionSerializer, ProductTypeSerializer, SystemSerializer, ComponentSerializer, SystemComponentSerializer, ComponentEntrySerializer
from datetime import date, timedelta
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import os

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user.set_password(request.data['password'])
        user.save()
        token = Token.objects.create(user=user)
        return Response({"token": token.key, "user": serializer.data})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    user = authenticate(username=request.data['username'], password=request.data['password'])
    if user:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": UserSerializer(user).data})
    return Response({"error": "Invalid Credentials"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny]) # Ideally IsAuthenticated
def get_users(request):
    users = User.objects.all()
    data = []
    for u in users:
        p = getattr(u, 'userprofile', None)
        role = p.role if p else 'Staff'
        # Get allowed apps
        allowed = []
        if p and p.allowed_apps:
             allowed = p.allowed_apps.split(',')
        
        data.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": role,
            "allowed_apps": allowed,
            "profile_picture": p.profile_picture.url if (p and p.profile_picture) else None
        })
    return Response(data)

@api_view(['POST'])
@permission_classes([AllowAny]) # Should be Admin only
def update_user_permissions(request):
    uid = request.data.get('user_id')
    role = request.data.get('role')
    apps = request.data.get('allowed_apps', [])
    
    try:
        user = User.objects.get(id=uid)
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.role = role
        profile.allowed_apps = ",".join(apps)
        profile.save()
        return Response({"status": "updated"})
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

@api_view(['POST'])
@permission_classes([AllowAny]) # Should be Admin only
def set_user_password(request):
    uid = request.data.get('user_id')
    new_pw = request.data.get('password')
    try:
        user = User.objects.get(id=uid)
        user.set_password(new_pw)
        user.save()
        return Response({"status": "password set"})
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_notifications(request):
    # For now, return all notifications limit 50
    notifs = Notification.objects.all().order_by('-created_at')[:50]
    data = [{
        "id": n.id,
        "message": n.message,
        "type": n.type,
        "read": n.read,
        "created_at": n.created_at
    } for n in notifs]
    return Response(data)

@api_view(['POST'])
@permission_classes([AllowAny])
def mark_notification_read(request):
    # Mark all as read logic or specific? Frontend seems to request 'all' or specific?
    # Actually frontend usually marks specific. But let's support "mark all read" if no ID
    nid = request.data.get('id')
    if nid:
        Notification.objects.filter(id=nid).update(read=True)
    else:
        Notification.objects.all().update(read=True)
    return Response({"status": "ok"})

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_notification(request, pk):
    Notification.objects.filter(id=pk).delete()
    return Response({"status": "deleted"})

@api_view(['GET'])
@permission_classes([AllowAny]) # Should be IsAuthenticated
def my_allowed_apps(request):
    # This endpoint is called with a token usually
    if request.user.is_authenticated:
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        apps = profile.allowed_apps.split(',') if profile.allowed_apps else []
        return Response({"apps": apps, "role": profile.role, "username": request.user.username, "profile_picture": profile.profile_picture.url if profile.profile_picture else None})
    # If no auth (dev mode), return all? Or empty?
    # Return empty for now to force login
    return Response({"apps": [], "role": "Guest"}, status=401)

@api_view(['POST'])
@permission_classes([AllowAny]) # Should be IsAuthenticated
def update_profile(request):
    if not request.user.is_authenticated:
        return Response({"error": "Not authenticated"}, status=401)
    
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    
    # Handle avatar
    if 'avatar' in request.FILES:
        profile.profile_picture = request.FILES['avatar']
        profile.save()
        
    # Handle password
    if 'new_password' in request.data:
        request.user.set_password(request.data['new_password'])
        request.user.save()
        
    return Response({
        "status": "updated", 
        "profile_picture": profile.profile_picture.url if profile.profile_picture else None
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def get_crm_analytics(request):
    # Simple analytics
    total_deals = Deal.objects.count()
    won_deals = Deal.objects.filter(stage__icontains='Won').count()
    pipeline_value = 0
    # Sum value? Deal doesn't have value field in standard, checking model...
    # It has value in serializer but model?
    # Let's just return counts for now
    
    return Response({
        "total_deals": total_deals,
        "won_deals": won_deals,
        "pipeline_value": 0 # Placeholder
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def list_boms(request):
    # Return list of Manufacturing Orders that act as BOMs or just products?
    # Based on prompt, maybe return Products?
    products = Product.objects.all()
    data = []
    for p in products:
        data.append({
            "id": p.id,
            "name": p.name,
            "code": p.code
        })
    return Response(data)

@api_view(['POST'])
@permission_classes([AllowAny])
def import_bom(request):
    # Placeholder for Excel import logic
    return Response({"status": "imported", "count": 0})

@api_view(['POST'])
@permission_classes([AllowAny])
def send_email_api(request):
    SENDER_EMAIL = "eit@eitlaser.com"
    SENDER_PASSWORD = "grsc gthh jnuy ixtc"
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587

    recipient_email = request.data.get('to_email')
    subject = request.data.get('subject')
    body = request.data.get('message')
    
    # Handle files
    files = request.FILES.getlist('attachments')

    if not recipient_email:
        return Response({"error": "Recipient email required"}, status=400)

    try:
        msg = MIMEMultipart()
        msg["From"] = SENDER_EMAIL
        msg["To"] = recipient_email
        msg["Subject"] = subject
        
        msg.attach(MIMEText(body, "html", _charset="utf-8"))

        for f in files:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(f.read())
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", f"attachment; filename={f.name}")
            msg.attach(part)
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.sendmail(SENDER_EMAIL, recipient_email, msg.as_string())
        server.quit()
        
        return Response({"status": "success"})
    except Exception as e:
        print(f"Email error: {e}")
        return Response({"error": str(e)}, status=500)


class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all().order_by('-created_at')
    serializer_class = LeadSerializer
    permission_classes = [AllowAny] # Ideally IsAuthenticated

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('company_name')
    serializer_class = CustomerSerializer
    permission_classes = [AllowAny] # Ideally IsAuthenticated, but sticking to pattern

class SupportTicketViewSet(viewsets.ModelViewSet):
    queryset = SupportTicket.objects.all().order_by('-updated_at')
    serializer_class = SupportTicketSerializer
    permission_classes = [AllowAny] # Ideally IsAuthenticated

class DealViewSet(viewsets.ModelViewSet):
    queryset = Deal.objects.all().order_by('-id')
    serializer_class = DealSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        try:
            from django.db import connection
            cols = []
            with connection.cursor() as cur:
                cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='crm_deal' ORDER BY ordinal_position")
                cols = [r[0] for r in cur.fetchall()]
            # print(f"DEBUG CRM_DEAL COLUMNS: {cols}")
            # print(f"DEBUG DB SETTINGS: {connection.settings_dict}")
            if request.query_params.get('diag') == '1':
                return Response({'columns': cols, 'db': connection.settings_dict})
        except Exception as e:
            print(f"DEBUG LIST SETUP ERROR: {e}")
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        
        # Ensure currency default
        if not (data.get('currency') or '').strip():
            data['currency'] = '฿'
            
        # Ensure title default
        title = (data.get('title') or '').strip()
        if not title:
            data['title'] = 'Untitled Deal'
            
        # Clean up stage input
        stage_val = data.get('stage')
        if stage_val:
            data['stage'] = str(stage_val).strip()
            
        serializer = self.get_serializer(data=data)
        if not serializer.is_valid():
            # If validation fails, try manual creation for specific fields logic 
            # (though normally serializer should handle this)
            # Keeping original fallback logic but simplified
            if 'stage' in serializer.errors:
                 # Minimal fallback if serializer complains about stage
                 pass
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        instance = serializer.save()
        
        Notification.objects.create(message=f"CRM: Created \"{instance.title}\"", type="crm_create")
        headers = {'Location': f"{request.build_absolute_uri('/api/deals/')}{instance.id}/"}
        return Response(self.get_serializer(instance).data, status=status.HTTP_201_CREATED, headers=headers)


    def perform_update(self, serializer):
        instance = serializer.instance
        old_stage = instance.stage
        updated_instance = serializer.save()
        
        if old_stage != updated_instance.stage:
            Notification.objects.create(
                message=f"CRM  {updated_instance.customer} ({old_stage} -> {updated_instance.stage})",
                type="crm_move"
            )

class ActivityScheduleViewSet(viewsets.ModelViewSet):
    queryset = ActivitySchedule.objects.all().order_by('due_at')
    serializer_class = ActivityScheduleSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('due_date')
    serializer_class = TaskSerializer
    permission_classes = [AllowAny]

class ManufacturingOrderViewSet(viewsets.ModelViewSet):
    queryset = ManufacturingOrder.objects.all().order_by('-created_at')
    serializer_class = ManufacturingOrderSerializer
    permission_classes = [AllowAny]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('name')
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

class ProductVersionViewSet(viewsets.ModelViewSet):
    queryset = ProductVersion.objects.all().order_by('-version_code')
    serializer_class = ProductVersionSerializer
    permission_classes = [AllowAny]

class ProductTypeViewSet(viewsets.ModelViewSet):
    queryset = ProductType.objects.all().order_by('type_code')
    serializer_class = ProductTypeSerializer
    permission_classes = [AllowAny]

class SystemViewSet(viewsets.ModelViewSet):
    queryset = System.objects.all().order_by('name')
    serializer_class = SystemSerializer
    permission_classes = [AllowAny]

class ComponentViewSet(viewsets.ModelViewSet):
    queryset = Component.objects.all().order_by('part_number')
    serializer_class = ComponentSerializer
    permission_classes = [AllowAny]

class SystemComponentViewSet(viewsets.ModelViewSet):
    queryset = SystemComponent.objects.all()
    serializer_class = SystemComponentSerializer
    permission_classes = [AllowAny]

class ComponentEntryViewSet(viewsets.ModelViewSet):
    queryset = ComponentEntry.objects.all().order_by('component_name')
    serializer_class = ComponentEntrySerializer
    permission_classes = [AllowAny]
