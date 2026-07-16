from django.db import models


class Account(models.Model):
    class AccountType(models.TextChoices):
        ASSET = 'asset', 'Activo'
        LIABILITY = 'liability', 'Pasivo'
        EQUITY = 'equity', 'Patrimonio'
        REVENUE = 'revenue', 'Ingreso'
        EXPENSE = 'expense', 'Gasto'
        COST = 'cost', 'Costo'

    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=160)
    account_type = models.CharField(max_length=20, choices=AccountType.choices)
    parent = models.ForeignKey(
        'self',
        on_delete=models.PROTECT,
        related_name='children',
        null=True,
        blank=True,
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f'{self.code} - {self.name}'


class JournalEntry(models.Model):
    date = models.DateField()
    description = models.CharField(max_length=220)
    reference = models.CharField(max_length=120, blank=True)
    source = models.CharField(max_length=60, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']
        verbose_name_plural = 'journal entries'

    def __str__(self):
        return f'{self.date} - {self.description}'


class JournalLine(models.Model):
    entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='lines')
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='journal_lines')
    debit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    memo = models.CharField(max_length=180, blank=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f'{self.account} D:{self.debit} C:{self.credit}'
