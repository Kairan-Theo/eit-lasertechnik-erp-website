
@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_bom(request, pk):
    try:
        pk = int(pk)
        if pk > 0:
            # Positive ID -> ProductType (specific variant)
            # If this is the last ProductType for a Version/Product, should we clean up?
            # For now, just delete the Type.
            ProductType.objects.filter(id=pk).delete()
        elif pk < 0:
            # Negative ID -> Product (the whole product)
            Product.objects.filter(id=-pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
