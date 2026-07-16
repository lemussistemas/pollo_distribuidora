from django.contrib import admin

from .models import Account, JournalEntry, JournalLine


class JournalLineInline(admin.TabularInline):
    model = JournalLine
    extra = 0


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'account_type', 'parent', 'is_active')
    search_fields = ('code', 'name')
    list_filter = ('account_type', 'is_active')


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ('date', 'description', 'reference', 'source')
    search_fields = ('description', 'reference')
    list_filter = ('source',)
    inlines = [JournalLineInline]
