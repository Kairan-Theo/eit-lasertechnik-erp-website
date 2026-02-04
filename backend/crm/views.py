from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import Deal, UserProfile, Notification, ActivitySchedule, Quotation, Invoice, PurchaseOrder, Project, Task, Customer, SupportTicket, Lead, ManufacturingOrder, Product, ProductVersion, ProductType, System, Component, SystemComponent, ComponentEntry, EmailLog, EmailAttachment, DealHistory, BillingNote, EIT, CustomerPurchaseOrder, Stage, Inventory
from .serializers import DealSerializer, UserSerializer, ActivityScheduleSerializer, QuotationSerializer, InvoiceSerializer, PurchaseOrderSerializer, ProjectSerializer, TaskSerializer, CustomerSerializer, SupportTicketSerializer, LeadSerializer, ManufacturingOrderSerializer, ProductSerializer, ProductVersionSerializer, ProductTypeSerializer, SystemSerializer, ComponentSerializer, SystemComponentSerializer, ComponentEntrySerializer, EmailLogSerializer, DealHistorySerializer, BillingNoteSerializer, EITSerializer, CustomerPurchaseOrderSerializer, StageSerializer, InventorySerializer
from datetime import date, timedelta
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import os
import requests
from django.core.files.base import ContentFile
from django.http import HttpResponse



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

        # Log the email first
        email_log = EmailLog.objects.create(
            recipient=recipient_email,
            subject=subject,
            body=body
        )

        for f in files:
            content = f.read()
            
            # Email attachment
            part = MIMEBase("application", "octet-stream")
            part.set_payload(content)
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", f"attachment; filename={f.name}")
            msg.attach(part)
            
            # Save to DB
            attachment = EmailAttachment(email_log=email_log)
            attachment.file.save(f.name, ContentFile(content))
            attachment.save()
        
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
            # Log deal history
            DealHistory.objects.create(
                deal=updated_instance,
                from_stage=old_stage,
                to_stage=updated_instance.stage
            )

class EITViewSet(viewsets.ModelViewSet):
    queryset = EIT.objects.all()
    serializer_class = EITSerializer
    permission_classes = [AllowAny]

class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.all().order_by('-id')
    serializer_class = QuotationSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

class BillingNoteViewSet(viewsets.ModelViewSet):
    queryset = BillingNote.objects.all().order_by('-bn_created_date')
    serializer_class = BillingNoteSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

class EmailLogViewSet(viewsets.ModelViewSet):
    queryset = EmailLog.objects.all().order_by('-sent_at')
    serializer_class = EmailLogSerializer
    permission_classes = [AllowAny]

class DealHistoryViewSet(viewsets.ModelViewSet):
    queryset = DealHistory.objects.all().order_by('-changed_at')
    serializer_class = DealHistorySerializer
    permission_classes = [AllowAny]

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
    queryset = ManufacturingOrder.objects.defer('po_file_content').all().order_by('-created_at')
    serializer_class = ManufacturingOrderSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

    @action(detail=True, methods=['get'], url_path='download')
    def download_po_file(self, request, pk=None):
        mo = self.get_object()
        
        # 1. Try serving file from MO directly
        if mo.po_file_content:
            response = HttpResponse(mo.po_file_content, content_type=mo.po_file_type)
            response['Content-Disposition'] = f'inline; filename="{mo.po_file_name}"'
            return response

        # 2. Fallback: Try looking up CustomerPurchaseOrder by po_number
        # This handles existing orders where file content wasn't copied
        if mo.po_number:
            search_po = str(mo.po_number).strip()
            # Try to find a matching CPO (case-insensitive)
            cpo = CustomerPurchaseOrder.objects.filter(po_number__iexact=search_po).first()
            
            if cpo and cpo.po_file_content:
                # Serve the CPO file
                response = HttpResponse(cpo.po_file_content, content_type=cpo.po_file_type)
                filename = cpo.po_file_name or mo.po_file_name or f"PO_{search_po}.pdf"
                response['Content-Disposition'] = f'inline; filename="{filename}"'
                return response

        return Response({"error": "No file attached"}, status=status.HTTP_404_NOT_FOUND)

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
    authentication_classes = []
    permission_classes = [AllowAny]


@api_view(['GET'])
@permission_classes([AllowAny])
def list_boms(request):
    products = Product.objects.all().prefetch_related(
        'versions__types__systems__system_components__component'
    )
    result = []
    products_with_boms = set()
    for product in products:
        for version in product.versions.all():
            for ptype in version.types.all():
                systems_list = []
                for system in ptype.systems.all():
                    components_list = []
                    for sc in system.system_components.select_related('component').all():
                        comp = sc.component
                        components_list.append({
                            'name': comp.name,
                            'qty': sc.quantity,
                            'part_number': comp.part_number,
                            'unit': comp.unit,
                        })
                    systems_list.append({
                        'name': system.name,
                        'components': components_list,
                    })
                result.append({
                    'id': ptype.id,
                    'product': product.name,
                    'version': version.version_code,
                    'type': ptype.type_code,
                    'productTree': {
                        'product': product.name,
                        'systems': systems_list,
                    },
                })
                products_with_boms.add(product.id)
    for product in products:
        if product.id in products_with_boms:
            continue
        result.append({
            'id': -product.id,
            'product': product.name,
            'version': '',
            'type': '',
            'productTree': {
                'product': product.name,
                'systems': [],
            },
        })
    return Response(result)

@api_view(['POST'])
@permission_classes([AllowAny])
def import_bom(request):
    data = request.data if isinstance(request.data, dict) else {}
    product_name = str(data.get('product') or '').strip()
    version_code = str(data.get('version') or '').strip() or 'v1'
    type_code = str(data.get('type') or '').strip() or 'standard'
    systems = data.get('systems') or []
    if not product_name:
        return Response({'error': 'product is required'}, status=status.HTTP_400_BAD_REQUEST)
    product, _ = Product.objects.get_or_create(name=product_name, defaults={'code': '', 'description': ''})
    version, _ = ProductVersion.objects.get_or_create(product=product, version_code=version_code, defaults={'description': ''})
    ptype, _ = ProductType.objects.get_or_create(version=version, type_code=type_code, defaults={'description': ''})
    created_rows = 0
    for s in systems or []:
        sys_name = str(s.get('name') or s.get('system') or '').strip()
        comps = s.get('components') or []
        if not sys_name or not ptype:
            continue
        sys_obj, _ = System.objects.get_or_create(type=ptype, name=sys_name)
        for c in comps:
            cname = str(c.get('name') or '').strip()
            qty = int(c.get('qty') or c.get('quantity') or 0)
            part_number = str(c.get('part_number') or '').strip() or cname
            unit = str(c.get('unit') or 'Unit').strip()
            comp_obj, _ = Component.objects.get_or_create(part_number=part_number, defaults={'name': cname or part_number, 'unit': unit})
            sc, created = SystemComponent.objects.get_or_create(system=sys_obj, component=comp_obj, defaults={'quantity': max(qty, 0)})
            if not created:
                sc.quantity = max(qty, 0)
                sc.save(update_fields=['quantity'])
            created_rows += 1
    return Response({'status': 'ok', 'created_or_updated': created_rows})

from .tracking_utils import fetch_tracking_status

@api_view(['GET'])
@permission_classes([AllowAny])
def check_tracking_status(request):
    courier = request.query_params.get('courier')
    number = request.query_params.get('number')
    if not courier or not number:
        return Response({'error': 'courier and number required'}, status=status.HTTP_400_BAD_REQUEST)
    
    status_text = fetch_tracking_status(courier, number)
    return Response({'status': status_text or 'Unknown'})

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
        company = ""
        if hasattr(user, 'profile'):
            allowed_apps = user.profile.allowed_apps
            company = user.profile.company or ""
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
            'profile_picture': profile_pic_url,
            'company': company
        })
    else:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    """
    Handle Google Sign-In.
    Expects 'credential' (ID token) from frontend.
    """
    token_id = request.data.get('credential')
    if not token_id:
        return Response({'error': 'No token provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify token with Google
    try:
        email = None
        google_data = {}
        
        # Development bypass for testing without valid Google Credentials
        if token_id.startswith("mock_token_"):
            email = "6531503143@lamduan.mfu.ac.th" # Default test user
            google_data = {
                'given_name': 'Test',
                'family_name': 'User',
                'picture': 'https://lh3.googleusercontent.com/a/default-user=s96-c'
            }
        else:
            # Using Google's tokeninfo endpoint to verify the token
            google_response = requests.get(f'https://oauth2.googleapis.com/tokeninfo?id_token={token_id}')
            
            if google_response.status_code != 200:
                return Response({'error': 'Invalid Google token'}, status=status.HTTP_400_BAD_REQUEST)
                
            google_data = google_response.json()
            email = google_data.get('email')
            
        if not email:
             return Response({'error': 'No email in token'}, status=status.HTTP_400_BAD_REQUEST)
             
        # Find or create user
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Create new user
            username = email.split('@')[0]
            # Ensure unique username
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
                
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=google_data.get('given_name', ''),
                last_name=google_data.get('family_name', '')
            )
            # Random password as they use google login
            user.set_unusable_password()
            user.save()
            
            # Create notification
            Notification.objects.create(
                message=f"New Google user: {email}",
                type="signup"
            )

        token, created = Token.objects.get_or_create(user=user)
        
        # Get allowed apps
        allowed_apps = ""
        profile_pic_url = None
        company = ""
        
        if hasattr(user, 'profile'):
            allowed_apps = user.profile.allowed_apps
            company = user.profile.company or ""
            # Update profile pic from google if not set
            if not user.profile.profile_picture and google_data.get('picture'):
                # We could download and save, or just store URL if we had a field. 
                # For now, we just don't sync picture to DB to avoid complexity, 
                # but we could return it in response.
                pass
                
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
            'profile_picture': profile_pic_url or google_data.get('picture'),
            'company': company
        })
            
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CustomerPurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = CustomerPurchaseOrder.objects.defer('po_file_content').all().order_by('-created_at')
    serializer_class = CustomerPurchaseOrderSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

    @action(detail=True, methods=['get'], url_path='download')
    def download_po_file(self, request, pk=None):
        cpo = self.get_object()
        if not cpo.po_file_content:
             return Response({"error": "No file attached"}, status=status.HTTP_404_NOT_FOUND)

        response = HttpResponse(cpo.po_file_content, content_type=cpo.po_file_type)
        response['Content-Disposition'] = f'inline; filename="{cpo.po_file_name}"'
        return response
    parser_classes = (MultiPartParser, FormParser)

class StageViewSet(viewsets.ModelViewSet):
    queryset = Stage.objects.all().order_by('order', 'created_at')
    serializer_class = StageSerializer
    permission_classes = [AllowAny]

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
        if hasattr(user, 'profile'):
            profile = user.profile
        else:
            profile = UserProfile.objects.create(user=user)
        
        # Ensure allowed_apps is a string
        if allowed_apps is None:
            allowed_apps = ""
            
        profile.allowed_apps = allowed_apps
        profile.save()
        
        return Response({'success': True, 'message': 'Permissions updated'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error updating permissions: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def set_user_password(request):
    user_id = request.data.get('user_id')
    new_password = request.data.get('new_password')
    if not user_id or not new_password:
        return Response({'error': 'user_id and new_password are required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(id=user_id)
        user.set_password(new_password)
        user.save()
        return Response({'success': True, 'message': 'Password updated'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_notifications(request):
    """
    Get recent notifications for admins.
    """
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
@permission_classes([IsAuthenticated])
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

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, pk):
    try:
        n = Notification.objects.get(id=pk)
        n.delete()
        return Response({'success': True})
    except Notification.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

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

    if 'company' in data:
        user.profile.company = data['company']
        user.profile.save()
        
    # Handle profile picture
    if 'profile_picture' in request.FILES:
        try:
            print(f"DEBUG: Received profile picture: {request.FILES['profile_picture'].name}")
            user.profile.profile_picture = request.FILES['profile_picture']
            user.profile.save()
            print("DEBUG: Profile picture saved successfully")
        except Exception as e:
            print(f"ERROR saving profile picture: {e}")
            return Response({'error': f'Failed to save image: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    
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
        'profile_picture': profile_pic_url,
        'company': user.profile.company
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def get_default_eit(request):
    # Try to find EIT LASERTECHNIK CO.,LTD or first one
    eit = EIT.objects.filter(organization_name__icontains="EIT LASERTECHNIK").first()
    if not eit:
        eit = EIT.objects.first()
    
    if eit:
        serializer = EITSerializer(eit)
        return Response(serializer.data)
    else:
        # Return default structure if no DB record (should not happen due to migration)
        return Response({
            "organization_name": "EIT LASERTECHNIK CO.,LTD",
            "eit_mobile": "000-000-0000",
            "eit_telephone": "02-052-9544",
            "eit_fax": "02-052-9544",
            "address": "1/120 ซอยรามคําแหง 184 \n แขวงมีนบุรี เขตมีนบุรี \n กรุงเทพมหานคร 10510"
        })


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_bom(request, pk):
    try:
        pk = int(pk)
        if pk > 0:
            # Positive ID -> ProductType
            ProductType.objects.filter(id=pk).delete()
        elif pk < 0:
            # Negative ID -> Product (the whole product)
            Product.objects.filter(id=-pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all().order_by('-created_at')
    serializer_class = PurchaseOrderSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)

class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all().order_by('-last_updated_day')
    serializer_class = InventorySerializer
    permission_classes = [AllowAny]
