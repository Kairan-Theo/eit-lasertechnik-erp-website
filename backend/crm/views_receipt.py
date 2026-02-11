
class ReceiptViewSet(viewsets.ModelViewSet):
    queryset = Receipt.objects.all().order_by('-created_at')
    serializer_class = ReceiptSerializer
    authentication_classes = []
    permission_classes = [AllowAny]
