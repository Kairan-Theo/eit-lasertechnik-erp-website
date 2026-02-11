
class ReceiptViewSet(viewsets.ModelViewSet):
    queryset = Receipt.objects.all().order_by('-created_at')
    serializer_class = ReceiptSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)
