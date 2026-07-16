from rest_framework import serializers

from .models import Account, JournalEntry, JournalLine


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = '__all__'


class JournalLineSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    account_code = serializers.CharField(source='account.code', read_only=True)

    class Meta:
        model = JournalLine
        fields = '__all__'
        read_only_fields = ('entry',)


class JournalEntrySerializer(serializers.ModelSerializer):
    lines = JournalLineSerializer(many=True)

    class Meta:
        model = JournalEntry
        fields = '__all__'

    def validate(self, attrs):
        lines = attrs.get('lines')
        if lines is not None:
            debit_total = sum(line.get('debit', 0) for line in lines)
            credit_total = sum(line.get('credit', 0) for line in lines)
            if debit_total != credit_total:
                raise serializers.ValidationError('El asiento no cuadra: el debe debe ser igual al haber.')
            if not lines:
                raise serializers.ValidationError('El asiento necesita al menos una linea.')
        return attrs

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        entry = JournalEntry.objects.create(**validated_data)
        for line_data in lines_data:
            JournalLine.objects.create(entry=entry, **line_data)
        return entry

    def update(self, instance, validated_data):
        lines_data = validated_data.pop('lines', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if lines_data is not None:
            instance.lines.all().delete()
            for line_data in lines_data:
                JournalLine.objects.create(entry=instance, **line_data)
        return instance
