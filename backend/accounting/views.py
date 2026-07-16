from django.shortcuts import render
from rest_framework import viewsets

from .models import Account, JournalEntry
from .serializers import AccountSerializer, JournalEntrySerializer


class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.select_related('parent').all()
    serializer_class = AccountSerializer
    search_fields = ['code', 'name']


class JournalEntryViewSet(viewsets.ModelViewSet):
    queryset = JournalEntry.objects.prefetch_related('lines__account').all()
    serializer_class = JournalEntrySerializer
