from datetime import datetime

from django.db import models
from django.utils import timezone


# Create your models here

class Game(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class GameEdition(models.Model):
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    edition_name = models.CharField(max_length=100, blank=True, null=True)
    release_year = models.PositiveIntegerField()

    def __str__(self):
        if self.edition_name:
            return f"{self.game} {self.edition_name}"
        else:
            return f"{self.game} ({self.release_year})"


class BuilderModel(models.Model):
    edition = models.ForeignKey(GameEdition, on_delete=models.CASCADE)
    name = models.CharField(max_length=100, blank=True, null=True)
    builder_id = models.CharField(max_length=40, blank=True, null=True)

    class Meta:
        abstract = True

    def __str__(self):
        return f"{self.name} from {self.edition}"


class Publication(BuilderModel):
    publication_year = models.PositiveIntegerField(blank=True, null=True)  # Since we can't be super exact with dates.
    publication_date = models.DateField(blank=True, null=True)


class ProfileType(BuilderModel):
    pass


class CharacteristicType(BuilderModel):
    profile_type = models.ForeignKey(ProfileType, on_delete=models.CASCADE)
    abbreviation = models.CharField(max_length=10)

    def __str__(self):
        return f"{self.name} on {self.profile_type}"


class PublishedBuilderModel(BuilderModel):
    publication = models.ForeignKey(Publication, on_delete=models.SET_NULL, blank=True, null=True)
    page_number = models.PositiveIntegerField(blank=True, null=True)

    class Meta:
        abstract = True


class Profile(PublishedBuilderModel):
    version_date = models.DateTimeField(default=timezone.now)  # Versions of profiles if multiple
    profile_type = models.ForeignKey(ProfileType, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.name} ({self.profile_type}) from {self.edition}"


class ProfileCharacteristic(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE)
    characteristic_type = models.ForeignKey(CharacteristicType, on_delete=models.CASCADE)
    value_text = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.characteristic_type} on {self.profile}"
